
import React, { useState, useEffect } from 'react';
import { storage } from '../../../services/storage';
import { SystemLog, LogModule } from '../../../types';
import { ICONS } from '../../../constants';

interface ActivityLogsProps {
    onNavigate: (module: LogModule) => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ onNavigate }) => {
    const [logs, setLogs] = useState<SystemLog[]>([]);

    useEffect(() => {
        setLogs(storage.getLogs());
        // Odświeżanie logów co 5 sekund, żeby widzieć zmiany na bieżąco
        const interval = setInterval(() => {
            const currentLogs = storage.getLogs();
            if (currentLogs.length !== logs.length) {
                setLogs(currentLogs);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [logs.length]);

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleString('pl-PL', { 
            hour: '2-digit', minute: '2-digit', 
            day: '2-digit', month: '2-digit' 
        });
    };

    const getModuleLabel = (mod: LogModule) => {
        switch(mod) {
            case 'USERS': return 'Kadry';
            case 'STRUCTURE': return 'Struktura';
            case 'EXAM': return 'Egzaminy';
            case 'QUESTIONS': return 'Pytania';
            case 'SETTINGS': return 'Ustawienia';
            default: return 'System';
        }
    };

    const getModuleColor = (mod: LogModule) => {
        switch(mod) {
            case 'USERS': return 'bg-blue-100 text-blue-800';
            case 'STRUCTURE': return 'bg-purple-100 text-purple-800';
            case 'EXAM': return 'bg-green-100 text-green-800';
            case 'QUESTIONS': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="dynamics-card bg-white border-t-4 border-[#002147] flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-[#EDEBE9] flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#C5A059]"></div>
                    <h3 className="text-xs font-black uppercase text-[#002147] tracking-widest">
                        Dziennik Operacji (Audit Log)
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setLogs(storage.getLogs())} className="p-1 hover:bg-gray-100 rounded text-[#002147]" title="Odśwież">
                        <ICONS.Refresh />
                    </button>
                </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar max-h-[400px]">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs italic">
                        Brak zarejestrowanych operacji w dzienniku.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#FAF9F8] text-[9px] font-bold uppercase text-[#A19F9D] sticky top-0">
                            <tr>
                                <th className="p-3 pl-5">Czas</th>
                                <th className="p-3">Użytkownik</th>
                                <th className="p-3">Akcja</th>
                                <th className="p-3 text-right pr-5">Opcje</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-[#F3F2F1]">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-[#F8FDFE] group transition-colors">
                                    <td className="p-3 pl-5 text-[#605E5C] font-mono whitespace-nowrap text-[10px]">
                                        {formatTime(log.timestamp)}
                                    </td>
                                    <td className="p-3 font-bold text-[#002147]">
                                        {log.actor}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getModuleColor(log.module)}`}>
                                                {getModuleLabel(log.module)}
                                            </span>
                                            <span className="font-bold text-[#002147]">{log.action}</span>
                                        </div>
                                        <p className="text-[10px] text-[#605E5C] truncate max-w-[250px]" title={log.details}>
                                            {log.details}
                                        </p>
                                    </td>
                                    <td className="p-3 text-right pr-5">
                                        <button 
                                            onClick={() => onNavigate(log.module)}
                                            className="text-[#C5A059] hover:text-[#002147] text-[9px] font-bold uppercase tracking-widest border border-transparent hover:border-[#002147] px-2 py-1 rounded transition-all flex items-center gap-1 ml-auto"
                                        >
                                            PRZEJDŹ <span>&rarr;</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
