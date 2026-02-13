
import React, { useEffect } from 'react';
import { ICONS } from '../../constants';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
}

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 6000); // Wydłużony czas wyświetlania dla czytania komunikatów o zmianie ID
        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const variants = {
        success: {
            bg: 'bg-[#002147]',
            border: 'border-[#C5A059]',
            iconColor: 'text-[#C5A059]',
            icon: <ICONS.Check />
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-500',
            iconColor: 'text-red-600',
            icon: <ICONS.Alert />
        },
        info: {
            bg: 'bg-white',
            border: 'border-[#002147]',
            iconColor: 'text-[#002147]',
            icon: <ICONS.Info />
        }
    };

    const style = variants[toast.type];

    return (
        <div className={`
            flex items-start gap-3 p-4 rounded-md shadow-2xl border-l-4 w-96 md:w-[450px]
            animate-in slide-in-from-right-full duration-300
            ${style.bg} ${style.border}
        `}>
            <div className={`mt-0.5 ${style.iconColor} shrink-0`}>
                {style.icon}
            </div>
            <div className="flex-1">
                <h4 className={`text-sm font-bold uppercase tracking-tight mb-1 ${toast.type === 'success' ? 'text-white' : 'text-[#002147]'}`}>
                    {toast.title}
                </h4>
                <p className={`text-xs leading-relaxed ${toast.type === 'success' ? 'text-gray-300' : 'text-[#605E5C]'}`}>
                    {toast.message}
                </p>
            </div>
            <button 
                onClick={() => onClose(toast.id)}
                className={`shrink-0 hover:opacity-70 transition-opacity ${toast.type === 'success' ? 'text-white' : 'text-gray-500'}`}
            >
                ✕
            </button>
        </div>
    );
};
