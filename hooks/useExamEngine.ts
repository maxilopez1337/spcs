
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Question, ExamResult, QuestionType, AnswerLog } from '../types';
import { storage } from '../services/storage';
import { emailService } from '../services/emailService';
import { useToast } from './useToast';
import { TIME_PER_QUESTION, PASS_THRESHOLD, EXAM_QUESTION_COUNT } from '../constants';

type ExamStatus = 'INTRO' | 'COUNTDOWN' | 'EXAM' | 'FINISHING';

// Algorytm Fisher-Yates do tasowania
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const useExamEngine = (user: User, onFinish: (result: ExamResult) => void) => {
    const { addToast } = useToast();
    
    // State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, { value: string; justification?: string }>>({});
    const [status, setStatus] = useState<ExamStatus>('INTRO');
    const [countdown, setCountdown] = useState(10);
    const [timers, setTimers] = useState<Record<string, number>>({});
    const [processingMessage, setProcessingMessage] = useState('');

    // Refs dla timerów, aby uniknąć problemów z closure w setInterval
    const timersRef = useRef<Record<string, number>>({});
    const answersRef = useRef<Record<string, { value: string }>>({}); // Do szybkiego sprawdzania w timerze

    // Synchronizacja refów
    useEffect(() => { answersRef.current = answers; }, [answers]);

    // 1. INICJALIZACJA I LOSOWANIE PYTAŃ
    useEffect(() => {
        storage.startExamSession(user.email);
        const all = storage.getQuestions();
        
        if (all.length === 0) {
            setQuestions([]);
            addToast('error', 'Błąd Krytyczny', 'Baza pytań jest pusta. Skontaktuj się z administratorem.');
            return;
        }

        const uniqueAll = Array.from(new Map(all.map(item => [item.id, item])).values());

        // Logika losowania (zachowana z oryginału)
        let pool: Question[] = [];
        if (user.email === 'test@stratton-prime.pl') {
            pool = uniqueAll;
        } else {
            const part3 = uniqueAll.filter(q => q.id.startsWith('q3-'));
            const part2 = uniqueAll.filter(q => q.id.startsWith('q-p2-'));
            const part1 = uniqueAll.filter(q => !q.id.startsWith('q3-') && !q.id.startsWith('q-p2-'));

            const selectedP3 = shuffleArray(part3).slice(0, 8);
            const selectedP2 = shuffleArray(part2).slice(0, 8);
            const selectedP1 = shuffleArray(part1).slice(0, 4);

            pool = [...selectedP3, ...selectedP2, ...selectedP1];

            if (pool.length < EXAM_QUESTION_COUNT) {
                const usedIds = new Set(pool.map(q => q.id));
                const remaining = uniqueAll.filter(q => !usedIds.has(q.id));
                pool = [...pool, ...shuffleArray(remaining).slice(0, EXAM_QUESTION_COUNT - pool.length)];
            }
        }

        // Tasowanie pytań i odpowiedzi wewnątrz pytań
        const randomizedPool = shuffleArray(pool).map(q => {
            if ((q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.MULTI_SELECT) && q.options) {
                return { ...q, options: shuffleArray(q.options) };
            }
            return q;
        });

        setQuestions(randomizedPool);

        // Inicjalizacja timerów
        const initialTimers: Record<string, number> = {};
        randomizedPool.forEach(q => { initialTimers[q.id] = TIME_PER_QUESTION; });
        setTimers(initialTimers);
        timersRef.current = initialTimers;

        // Anti-cheat: Zamykanie karty
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Opuszczenie strony spowoduje niezaliczenie egzaminu.";
            return "Opuszczenie strony spowoduje niezaliczenie egzaminu.";
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [user.email]);

    // 2. ODLICZANIE STARTOWE + FULLSCREEN + MONITORING WYJŚCIA
    useEffect(() => {
        if (status === 'COUNTDOWN') {
            // Próba wejścia w Fullscreen
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => console.log("Fullscreen blocked:", err));
            }

            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                setStatus('EXAM');
            }
        }
    }, [status, countdown]);

    // MONITORING FULLSCREEN (Anti-Cheat Level 2)
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && status === 'EXAM') {
                addToast('error', 'Naruszenie Bezpieczeństwa', 'Wykryto opuszczenie trybu pełnoekranowego. Zdarzenie zostało odnotowane w logach.');
                // Opcjonalnie: Możemy tu dodać logikę karania, np. odjęcie czasu, ale na razie tylko logujemy.
                storage.addLog(
                    'SECURITY ALERT', 
                    `Użytkownik opuścił tryb pełnoekranowy podczas egzaminu. Pytanie: ${currentIndex + 1}`, 
                    'EXAM', 
                    user.id
                );
            }
        };

        if (status === 'EXAM') {
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari support
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [status, currentIndex, user.id, addToast]);


    // 3. FINALIZACJA EGZAMINU
    const submitExam = useCallback(async () => {
        // Wyjście z Fullscreen
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(console.error);
        }

        const answersLog: AnswerLog[] = [];
        let correctCount = 0;

        questions.forEach(q => {
            const userAnsObj = answers[q.id];
            const userValue = userAnsObj?.value || '';
            let isCorrect = false;

            // Logika sprawdzania (zachowana)
            if (q.type === QuestionType.OPEN) {
                if (q.correctAnswer && q.correctAnswer.trim().length > 0) {
                    isCorrect = userValue.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                } else {
                    isCorrect = userValue.length > 5; // Fallback dla otwartych bez klucza
                }
            } else if (q.type === QuestionType.MULTI_SELECT) {
                const userSelected = userValue.split('|').filter(x => x).sort().join('|');
                const correctSelected = (q.correctAnswer || '').split('|').filter(x => x).sort().join('|');
                isCorrect = userSelected === correctSelected;
            } else {
                isCorrect = userValue === q.correctAnswer;
            }

            if (isCorrect) correctCount++;

            answersLog.push({
                questionId: q.id,
                questionText: q.text,
                type: q.type,
                userAnswer: userValue.replace(/\|/g, ', ') || '(Brak odpowiedzi)',
                correctAnswer: q.correctAnswer ? q.correctAnswer.replace(/\|/g, ', ') : '(Opisowe)',
                isCorrect: isCorrect
            });
        });

        const scoreValue = Math.round((correctCount / questions.length) * 100);
        const isPassed = scoreValue >= (PASS_THRESHOLD * 100);
        const examDate = new Date().toLocaleDateString('pl-PL') + ' ' + new Date().toLocaleTimeString('pl-PL');
        
        setStatus('FINISHING');
        setProcessingMessage(isPassed ? 'Weryfikacja: POZYTYWNA. Finalizacja...' : 'Weryfikacja: NEGATYWNA. Przetwarzanie...');

        const previousFailures = storage.getFailedAttemptsCount(user.email);
        // Jeśli zdał, liczba porażek się nie zmienia. Jeśli nie zdał, rośnie.
        const currentFailCount = isPassed ? previousFailures : previousFailures + 1;

        const result: ExamResult = {
            id: Math.random().toString(36).substr(2, 9),
            userName: `${user.firstName} ${user.lastName}`,
            hierarchicalId: user.hierarchicalId,
            email: user.email,
            managerName: user.managerName,
            managerEmail: user.managerEmail,
            score: scoreValue,
            passed: isPassed,
            date: examDate,
            answersLog: answersLog
        };

        storage.saveResult(result);
        storage.clearExamSession();
        
        // Symulacja async dla UX
        await new Promise(r => setTimeout(r, 1500));
        
        // Wysyłka maila w tle
        emailService.sendExamResult(result, undefined, currentFailCount)
            .then(res => console.log(res.text))
            .catch(err => console.error(err));
        
        onFinish(result);
    }, [questions, answers, user, onFinish]);

    // 4. NAWIGACJA (Smart Navigation)
    const handleSmartNavigation = useCallback(() => {
        // Znajdź pytania, które nie mają odpowiedzi I mają jeszcze czas
        const playableIndices = questions
            .map((q, i) => {
                const isAns = !!answers[q.id]?.value;
                const time = timersRef.current[q.id];
                const hasTime = time === undefined || time > 0;
                return (!isAns && hasTime) ? i : -1;
            })
            .filter(i => i !== -1);
        
        if (playableIndices.length === 0) {
            submitExam();
            return;
        }

        // Szukaj następnego w przód
        const nextAhead = playableIndices.find(i => i > currentIndex);

        if (nextAhead !== undefined) {
            setCurrentIndex(nextAhead);
        } else {
            // Jeśli nie ma z przodu, wróć do początku (pętla)
            const firstPlayable = playableIndices[0];
            if (firstPlayable !== undefined && firstPlayable !== currentIndex) {
                addToast('info', 'Powrót do pytań', `Przechodzenie do pominiętego pytania nr ${firstPlayable + 1}`);
                setCurrentIndex(firstPlayable);
            }
        }
    }, [questions, answers, currentIndex, submitExam, addToast]);

    // 5. GŁÓWNY TIMER (Per pytanie)
    useEffect(() => {
        if (status !== 'EXAM') return;
        const currentQ = questions[currentIndex];
        if (!currentQ) return;

        const timerId = setInterval(() => {
            const currentQId = questions[currentIndex]?.id; // Pobieramy ID aktualnego pytania wewnątrz interwału
            if(!currentQId) return;

            const timeLeft = timersRef.current[currentQId] || 0;

            if (timeLeft <= 0) {
                // Czas się skończył dla tego pytania
                // Sprawdzamy czy są inne pytania do gry
                const anyOtherPlayable = questions.some((q) => {
                    if (q.id === currentQId) return false;
                    const isAns = !!answersRef.current[q.id]?.value;
                    const t = timersRef.current[q.id];
                    return !isAns && (t === undefined || t > 0);
                });

                if (anyOtherPlayable) {
                    addToast('error', 'Czas minął!', 'Automatyczne przejście do kolejnego pytania.');
                    handleSmartNavigation();
                } else {
                    setProcessingMessage("Koniec czasu sesji...");
                    submitExam();
                }
                clearInterval(timerId); // Zatrzymujemy ten interwał po nawigacji
            } else {
                // Dekrementacja
                const newValue = timeLeft - 1;
                timersRef.current[currentQId] = newValue;
                // Aktualizujemy stan Reacta dla UI co sekundę
                setTimers(prev => ({ ...prev, [currentQId]: newValue }));
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [status, currentIndex, questions, handleSmartNavigation, submitExam, addToast]); // Zależności interwału

    const handleAnswer = (val: string, justification?: string) => {
        setAnswers(prev => ({ 
            ...prev, 
            [questions[currentIndex].id]: { value: val, justification } 
        }));
    };

    const startExam = () => setStatus('COUNTDOWN');

    return {
        questions,
        currentQuestion: questions[currentIndex],
        currentIndex,
        answers,
        timers,
        status,
        countdown,
        processingMessage,
        handleAnswer,
        startExam,
        handleSmartNavigation,
        isTimeCritical: (timers[questions[currentIndex]?.id] || 0) <= 10
    };
};
