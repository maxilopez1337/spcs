
import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { ICONS } from '../../../constants';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

interface UserListProps {
  users: User[];
  selectedIds: Set<string>;
  startIndex: number;
  certificationMap?: Map<string, { passed: boolean; attempts: number; maxScore: number; lastDate: string }>; 
  onUpdateUser: (user: User) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string, email: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectOne: (id: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ 
  users, 
  selectedIds, 
  startIndex,
  certificationMap,
  onUpdateUser, 
  onDelete,
  onResetPassword,
  onToggleSelectAll, 
  onToggleSelectOne 
}) => {
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<User | null>(null);

  const allSelected = users.length > 0 && users.every(u => selectedIds.has(u.id));

  // Mapa relacji: Kto jest czyim szefem
  const relationships = useMemo(() => {
      const managerMap = new Map<string, string[]>(); 
      users.forEach(u => {
          if (u.managerEmail) {
              const mEmail = u.managerEmail.toLowerCase().trim();
              if (!managerMap.has(mEmail)) managerMap.set(mEmail, []);
              managerMap.get(mEmail)!.push(u.email.toLowerCase().trim());
          }
      });
      return managerMap;
  }, [users]);

  // 1. KOLOR GAŁĘZI (ZESPOŁU) - KTO JEST SZEFEM GŁÓWNYM
  const getBranchColor = (hierarchicalId: string) => {
      const parts = hierarchicalId.split('/');
      
      // Level 0 (ROOT) - Granatowy Stratton (Neutralny)
      if (parts.length === 1) return '#002147'; 

      // Pobieramy identyfikator lidera gałęzi (zawsze drugi element, np. JA w GDJJ/JA/...)
      const branchKey = parts[1];

      // Paleta kolorów dla Zespołów
      const palette: Record<string, string> = {
          'JA': '#059669', // Jarosław A. (Szmaragdowy)
          'NK': '#7C3AED', // Natalia K. (Fioletowy)
          'TP': '#DC2626', // Tymoteusz P. (Czerwony)
          'KR': '#2563EB', // Kacper R. (Niebieski Królewski)
          'TL': '#D97706', // Tomasz L. (Bursztynowy)
          'MJ': '#0891B2', // Maciej J. (Cyjan)
          'PD': '#DB2777', // Piotr D. (Różowy)
      };

      return palette[branchKey] || '#6B7280'; // Domyślny szary
  };

  // 2. KOLOR ROLI (RANGI) - KIM JEST PRACOWNIK
  const getRoleConfig = (u: User) => {
      const level = (u.hierarchicalId.match(/\//g) || []).length;
      const userEmail = u.email.toLowerCase().trim();
      const hasChildren = relationships.has(userEmail);

      // Poziom 0: Główny Dyrektor Struktury
      if (level === 0) {
          return { 
              color: '#002147', 
              label: 'DYREKTOR STRUKTURY', 
              icon: '👑', 
              indent: 0,
              isManager: true
          };
      }
      
      // Poziom 1: Dyrektor Manager
      if (level === 1) {
          return { 
              color: '#C5A059', // ZŁOTY
              label: 'DYREKTOR MANAGER', 
              icon: '🏆',
              indent: 24,
              isManager: true
          };
      }

      // Poziomy 2+: Manager lub Doradca
      if (hasChildren) {
          return { 
              color: '#4B5563', // SZARY (Manager)
              label: 'MANAGER DORADCA', 
              icon: '💼',
              indent: Math.min(level * 24, 96),
              isManager: true
          };
      } else {
          return { 
              color: '#0078D4', // NIEBIESKI (Doradca)
              label: 'DORADCA BIZNESOWY', 
              icon: '👤',
              indent: Math.min(level * 24, 96),
              isManager: false
          };
      }
  };

  const getTeamSize = (email: string) => {
      const directReports = relationships.get(email.toLowerCase().trim()) || [];
      return directReports.length;
  };

  const handleRowClick = (user: User) => {
      if (expandedId === user.id) {
          setExpandedId(null);
          setEditFormData(null);
      } else {
          setExpandedId(user.id);
          setEditFormData({ ...user });
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (editFormData) {
          onUpdateUser(editFormData);
          setExpandedId(null);
          setEditFormData(null);
      }
  };

  const handleCancel = () => {
      setExpandedId(null);
      setEditFormData(null);
  };

  return (
    <div className="dynamics-card overflow-hidden bg-white shadow-lg border-t-4 border-[#002147]">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1100px] border-collapse">
            <thead className="bg-[#002147] text-[10px] font-bold uppercase text-[#C5A059] sticky top-0 z-10 shadow-md">
            <tr>
                <th className="p-4 w-10 text-center">
                    <input 
                        type="checkbox"
                        checked={allSelected}
                        onChange={e => onToggleSelectAll(e.target.checked)}
                        className="cursor-pointer accent-[#C5A059]"
                    />
                </th>
                <th className="p-4 w-16 text-center text-white/50">Lp.</th>
                <th className="p-4 w-[30%]">Struktura Organizacyjna</th>
                <th className="p-4 w-[15%]">Status / Rola</th>
                <th className="p-4 w-[15%]">Status Certyfikacji</th>
                <th className="p-4 w-[15%]">Dane Logowania</th>
                <th className="p-4 w-[10%]">Przełożony</th>
                <th className="p-4 w-24 text-center">Akcja</th>
            </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#EDEBE9]">
            {users.length === 0 && (
                <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400 italic">
                        Brak wyników wyszukiwania. Spróbuj zmienić filtry.
                    </td>
                </tr>
            )}
            {users.map((u, index) => {
                const isSelected = selectedIds.has(u.id);
                const isExpanded = expandedId === u.id;
                
                const roleConfig = getRoleConfig(u); // ROLA (Ikona, Tekst)
                const branchColor = getBranchColor(u.hierarchicalId); // GAŁĄŹ (Border)
                
                const teamSize = getTeamSize(u.email);
                const certStatus = certificationMap?.get(u.email.toLowerCase().trim());

                return (
                    <React.Fragment key={u.id}>
                        {/* GŁÓWNY WIERSZ */}
                        <tr 
                            onClick={() => handleRowClick(u)}
                            className={`
                                transition-all duration-200 cursor-pointer border-l-[6px] group relative
                                ${isExpanded ? 'bg-[#EFF6FC]' : 'hover:bg-[#FAF9F8]'}
                                ${isSelected ? 'bg-blue-50' : ''}
                            `}
                            // TUTAJ: Kolor bordera to kolor GAŁĘZI (Zespołu)
                            style={{ borderLeftColor: branchColor }}
                        >
                            <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onToggleSelectOne(u.id)}
                                    className="cursor-pointer accent-[#002147]"
                                />
                            </td>
                            <td className="p-4 text-[#A19F9D] font-mono text-center">{startIndex + index + 1}</td>
                            
                            {/* KOLUMNA STRUKTURY Z LINIAMI */}
                            <td className="p-4 relative">
                                <div className="flex items-center" style={{ paddingLeft: `${roleConfig.indent}px` }}>
                                    {/* Linie prowadzące - w kolorze gałęzi, ale jaśniejsze */}
                                    {roleConfig.indent > 0 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ left: `${roleConfig.indent + 16}px`, backgroundColor: `${branchColor}40` }}></div>
                                    )}
                                    {roleConfig.indent > 0 && (
                                        <div className="absolute w-4 h-px" style={{ left: `${roleConfig.indent}px`, top: '50%', backgroundColor: `${branchColor}40` }}></div>
                                    )}
                                    
                                    <div className="relative z-10 flex items-start gap-3">
                                        {/* Avatar / Ikona w kolorze ROLI (Rangi) */}
                                        <div 
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm border border-black/5 text-white relative`}
                                            style={{ backgroundColor: roleConfig.color }}
                                        >
                                            {roleConfig.icon}
                                            {/* Mała kropka gałęzi przy avatarze */}
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: branchColor }} title="Kolor Zespołu"></div>
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${isExpanded ? 'text-[#002147]' : 'text-[#323130]'}`}>
                                                {u.firstName} {u.lastName}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {/* Etykieta roli w kolorze ROLI */}
                                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: roleConfig.color }}>
                                                    {roleConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <td className="p-4">
                                <div className="flex flex-col gap-1">
                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider w-fit border`}
                                          style={{ 
                                              borderColor: roleConfig.color, 
                                              color: roleConfig.color,
                                              backgroundColor: `${roleConfig.color}10` // Bardzo jasne tło w kolorze roli
                                          }}
                                    >
                                        {u.role}
                                    </span>
                                    {roleConfig.isManager && (
                                        <span className="text-[9px] font-bold text-[#605E5C] flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: branchColor}}></span>
                                            Zespół: {teamSize} os.
                                        </span>
                                    )}
                                </div>
                            </td>

                            {/* ... Reszta kolumn bez zmian ... */}
                            <td className="p-4">
                                {certStatus ? (
                                    certStatus.passed ? (
                                        <div className="flex items-center gap-2 px-2 py-1 bg-green-50 border border-green-200 rounded text-green-800 w-fit">
                                            <ICONS.Check />
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[10px] font-black uppercase tracking-wider">ZALICZONO</span>
                                                <span className="text-[9px] font-mono">{certStatus.maxScore}% | {certStatus.lastDate.split(' ')[0]}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-2 px-2 py-1 border rounded w-fit ${certStatus.attempts >= 3 ? 'bg-red-100 border-red-300 text-red-900' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                                            <ICONS.Alert />
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[10px] font-black uppercase tracking-wider">
                                                    {certStatus.attempts >= 3 ? 'BLOKADA (3/3)' : 'NIEZALICZONY'}
                                                </span>
                                                <span className="text-[9px]">Próba: {certStatus.attempts}/3 | {certStatus.maxScore}%</span>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        Brak podejścia
                                    </span>
                                )}
                            </td>

                            <td className="p-4">
                                <div className="text-[#323130] font-medium text-xs">{u.email}</div>
                                <div className="text-[9px] font-mono font-bold bg-black/5 inline-block px-1.5 rounded mt-1 border border-black/5 text-[#605E5C]">
                                    {u.hierarchicalId}
                                </div>
                            </td>

                            <td className="p-4 text-[#605E5C]">
                                {u.managerName ? (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[11px]">{u.managerName}</span>
                                        <span className="text-[9px] opacity-60">Przełożony</span>
                                    </div>
                                ) : (
                                    <span className="text-[#C5A059] font-bold text-[10px] uppercase tracking-widest">Główna Struktura</span>
                                )}
                            </td>

                            <td className="p-4 text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 mx-auto ${isExpanded ? 'bg-[#002147] text-white rotate-180' : 'bg-transparent text-gray-400 group-hover:bg-white group-hover:text-[#002147] group-hover:shadow-md'}`}>
                                    ▼
                                </div>
                            </td>
                        </tr>

                        {/* ROZWIJANY PANEL EDYCJI */}
                        {isExpanded && editFormData && (
                            <tr className="bg-[#FAF9F8] shadow-inner">
                                <td colSpan={8} className="p-0 cursor-default">
                                    <div className="p-6 border-b-2 border-[#C5A059] animate-in slide-in-from-top-2 duration-300">
                                        <form onSubmit={handleSave}>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-black uppercase text-[#002147] tracking-widest flex items-center gap-2">
                                                    <ICONS.Edit /> Edycja Profilu
                                                </h3>
                                                <div className="flex gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => onResetPassword(u.id, u.email)}
                                                        className="text-[10px] font-bold text-[#C5A059] hover:text-[#A68546] uppercase flex items-center gap-1 px-3 py-2 border border-[#C5A059]/30 rounded hover:bg-[#C5A059]/10 transition-colors"
                                                    >
                                                        <ICONS.Refresh /> Resetuj Hasło
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => onDelete(u.id)}
                                                        className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase flex items-center gap-1 px-3 py-2 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                                    >
                                                        <ICONS.Trash /> Usuń Konto
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                {/* Kolumna 1 */}
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest border-b border-gray-200 pb-1">Dane Personalne</p>
                                                    <Input 
                                                        label="Imię" 
                                                        value={editFormData.firstName} 
                                                        onChange={e => setEditFormData({...editFormData, firstName: e.target.value})}
                                                        className="bg-white"
                                                    />
                                                    <Input 
                                                        label="Nazwisko" 
                                                        value={editFormData.lastName} 
                                                        onChange={e => setEditFormData({...editFormData, lastName: e.target.value})}
                                                        className="bg-white"
                                                    />
                                                </div>

                                                {/* Kolumna 2 */}
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest border-b border-gray-200 pb-1">Dostępy Systemowe</p>
                                                    <Input 
                                                        label="E-mail (Login)" 
                                                        value={editFormData.email} 
                                                        onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                                                        className="bg-white font-mono text-xs"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input 
                                                            label="ID Hierarchiczne" 
                                                            value={editFormData.hierarchicalId} 
                                                            onChange={e => setEditFormData({...editFormData, hierarchicalId: e.target.value})}
                                                            className="bg-white font-mono text-xs font-bold text-[#002147]"
                                                        />
                                                        <Select 
                                                            label="Rola"
                                                            value={editFormData.role}
                                                            onChange={e => setEditFormData({...editFormData, role: e.target.value as any})}
                                                            options={[
                                                                { label: 'USER', value: 'USER' },
                                                                { label: 'MANAGER', value: 'MANAGER' },
                                                                { label: 'ADMIN', value: 'ADMIN' }
                                                            ]}
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Kolumna 3 */}
                                                <div className="space-y-4 bg-blue-50/50 p-3 rounded border border-blue-100">
                                                    <p className="text-[10px] font-bold text-[#002147] uppercase tracking-widest border-b border-blue-200 pb-1">Zależność Służbowa</p>
                                                    <Input 
                                                        label="Nazwa Przełożonego" 
                                                        value={editFormData.managerName || ''} 
                                                        onChange={e => setEditFormData({...editFormData, managerName: e.target.value})}
                                                        className="bg-white"
                                                        placeholder="np. Jan Kowalski"
                                                    />
                                                    <Input 
                                                        label="Email Przełożonego" 
                                                        value={editFormData.managerEmail || ''} 
                                                        onChange={e => setEditFormData({...editFormData, managerEmail: e.target.value})}
                                                        className="bg-white font-mono text-xs"
                                                        placeholder="email@stratton-prime.pl"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                                                <Button type="button" variant="ghost" onClick={handleCancel}>
                                                    Anuluj
                                                </Button>
                                                <Button type="submit" variant="primary" icon={<ICONS.Check />}>
                                                    Zapisz Zmiany
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                );
            })}
            </tbody>
        </table>
      </div>
    </div>
  );
};
