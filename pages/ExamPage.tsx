
import React from 'react';
import { User, ExamResult } from '../types';
import { ICONS, TIME_PER_QUESTION, EXAM_QUESTION_COUNT, PASS_THRESHOLD } from '../constants';
import { QuestionRenderer } from '../components/QuestionRenderer';
import { Button } from '../components/ui/Button';
import { useExamEngine } from '../hooks/useExamEngine';
import { storage } from '../services/storage';

interface ExamPageProps {
  user: User;
  onFinish: (result: ExamResult) => void;
}

export const ExamPage: React.FC<ExamPageProps> = ({ user, onFinish }) => {
  const {
    questions,
    currentQuestion,
    currentIndex,
    answers,
    timers,
    status,
    countdown,
    processingMessage,
    handleAnswer,
    startExam,
    handleSmartNavigation,
    isTimeCritical
  } = useExamEngine(user, onFinish);

  // --- EKRAN ŁADOWANIA / FINALIZACJI ---
  if (status === 'FINISHING') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-8">
        <div className="mb-8 relative">
           <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-[#C5A059]"></div>
        </div>
        <h2 className="text-2xl font-black text-[#002147] tracking-tight uppercase mb-4">Analiza Wyników</h2>
        <p className="text-sm text-[#605E5C]">{processingMessage}</p>
      </div>
    );
  }

  // --- EKRAN POWITALNY (INTRO) ---
  if (status === 'INTRO') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="dynamics-card max-w-5xl w-full p-6 md:p-12 border-t-8 border-[#C5A059] bg-white animate-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#EDEBE9] pb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#002147] uppercase tracking-tight">Procedura Egzaminacyjna</h1>
              <p className="text-[10px] md:text-xs text-[#605E5C] font-bold uppercase tracking-[0.2em] mt-1">Regulamin Certyfikacji Wiedzy - Stratton Prime</p>
            </div>
            <div className="px-3 py-2 md:px-4 md:py-2 bg-[#F3F2F1] rounded border border-[#EDEBE9] flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[#002147] font-bold text-xs md:text-sm">Sesja: {new Date().toLocaleDateString('pl-PL')}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
             <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#002147] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                    <div>
                        <h3 className="font-black text-[#002147] uppercase text-sm mb-1">Struktura i Bankowanie Czasu</h3>
                        <p className="text-xs text-[#605E5C] leading-relaxed">
                            Egzamin składa się z <strong>{EXAM_QUESTION_COUNT} pytań</strong>. Masz <strong>{(TIME_PER_QUESTION / 60).toFixed(0)}min {(TIME_PER_QUESTION % 60)}s</strong> na każde pytanie. 
                            <br/><span className="text-[#002147] font-bold">WAŻNE:</span> Czas jest liczony indywidualnie. Możesz wrócić do pominiętych pytań.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#002147] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                    <div>
                        <h3 className="font-black text-[#002147] uppercase text-sm mb-1">Próg Zaliczenia</h3>
                        <p className="text-xs text-[#605E5C] leading-relaxed">
                            Wymagane jest <strong>{Math.round(PASS_THRESHOLD * 100)}%</strong> poprawnych odpowiedzi. Zatwierdzenie odpowiedzi jest ostateczne.
                        </p>
                    </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-[#FAF9F8] border-l-4 border-red-600 p-4">
                    <h4 className="text-red-700 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ICONS.Alert /> Podejście nr {storage.getFailedAttemptsCount(user.email) + 1} z 3
                    </h4>
                    <p className="text-xs text-[#323130] leading-relaxed">
                        System monitoruje aktywność okna (Anti-Cheat). Odświeżenie strony lub wyjście z karty skutkuje natychmiastowym niezaliczeniem.
                    </p>
                </div>
             </div>
          </div>

          <div className="flex justify-center">
            {questions.length > 0 ? (
                <Button 
                  onClick={startExam} 
                  size="lg"
                  className="shadow-xl px-12 py-4 text-base"
                  icon={<ICONS.ArrowRight />}
                >
                  ROZPOCZNIJ EGZAMIN
                </Button>
            ) : (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded text-center text-sm font-bold">
                    ⛔ Baza pytań jest pusta. Skontaktuj się z Administratorem.
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- EKRAN ODLICZANIA ---
  if (status === 'COUNTDOWN') {
    return (
      <div className="fixed inset-0 bg-[#002147] z-[100] flex flex-col items-center justify-center text-white">
        <div className="text-[100px] md:text-[150px] font-black leading-none text-[#C5A059] animate-pulse">
          {countdown}
        </div>
        <p className="text-lg font-bold uppercase tracking-[0.5em] mt-8 opacity-60">Przygotuj się</p>
      </div>
    );
  }

  if (questions.length === 0 || !currentQuestion) return null;

  // --- EKRAN GŁÓWNY EGZAMINU ---
  
  const currentTimer = timers[currentQuestion.id] || 0;
  const timePercentage = (currentTimer / TIME_PER_QUESTION) * 100;
  
  const currentAnswer = answers[currentQuestion.id]?.value;
  const hasAnswer = !!currentAnswer;
  
  // Logic button label
  const playableCount = questions.filter(q => !answers[q.id]?.value && (timers[q.id] === undefined || timers[q.id] > 0)).length;
  let mainButtonLabel = hasAnswer ? 'ZATWIERDŹ ODPOWIEDŹ' : 'NASTĘPNE PYTANIE';
  if (playableCount <= 1) {
      mainButtonLabel = hasAnswer ? 'ZAKOŃCZ EGZAMIN' : 'POMIŃ I ZAKOŃCZ';
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      
      {/* 1. STICKY HEADER */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white shadow-md z-50 flex items-center justify-between px-3 md:px-8 border-b border-[#EDEBE9]">
         <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] text-[#A19F9D] font-bold uppercase tracking-widest">Postęp</span>
            <div className="flex items-center gap-1">
                <span className="text-base md:text-lg font-black text-[#002147]">{currentIndex + 1}</span>
                <span className="text-[10px] md:text-xs text-[#605E5C] font-medium">/ {questions.length}</span>
            </div>
         </div>

         <div className="hidden sm:block">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-[#fff] text-[#002147] border-[#C5A059]">
                {currentQuestion.category}
            </span>
         </div>

         <div className={`flex items-center gap-2 px-2 py-1 md:px-4 md:py-1.5 rounded-full border transition-all duration-300 ${isTimeCritical ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-[#EDEBE9]'}`}>
            <ICONS.Clock />
            <span className={`text-base md:text-xl font-black tabular-nums ${isTimeCritical ? 'text-red-600' : 'text-[#002147]'}`}>
                {currentTimer}s
            </span>
         </div>
      </header>

      {/* 2. PROGRESS BAR */}
      <div className="fixed top-14 left-0 right-0 h-1 bg-gray-200 z-40">
         <div 
            className={`h-full transition-all duration-1000 ease-linear ${isTimeCritical ? 'bg-red-500' : 'bg-[#C5A059]'}`}
            style={{ width: `${timePercentage}%` }}
         ></div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="pt-16 pb-24 md:pb-32 max-w-5xl mx-auto px-3 md:px-6">
        <div className={`transition-opacity duration-300 ${currentTimer === 0 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <QuestionRenderer 
                key={currentQuestion.id}
                question={currentQuestion} 
                onAnswer={handleAnswer} 
                currentValue={answers[currentQuestion.id]?.value || ''}
                currentJustification={answers[currentQuestion.id]?.justification || ''}
            />
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EDEBE9] p-3 md:p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="hidden md:flex text-[10px] text-[#A19F9D] uppercase tracking-widest items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Sesja Monitorowana
            </div>
            
            <Button 
                onClick={handleSmartNavigation}
                variant={hasAnswer ? 'primary' : 'outline'}
                size="lg"
                className={`w-full md:w-auto px-8 md:px-12 shadow-xl hover:translate-y-[-2px] transition-transform text-xs md:text-sm`}
                icon={<ICONS.ArrowRight />}
            >
                {mainButtonLabel}
            </Button>
         </div>
      </footer>
    </div>
  );
};
