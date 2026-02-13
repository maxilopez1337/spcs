
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { ICONS } from '../../../constants';

interface AddUserFormProps {
  onAdd: (u: Partial<User>) => void;
  existingUsers: User[]; 
}

interface TreeNode {
    user: User;
    children: TreeNode[];
}

export const AddUserForm: React.FC<AddUserFormProps> = ({ onAdd, existingUsers }) => {
  const [newUser, setNewUser] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    hierarchicalId: '',
    role: 'USER',
    managerName: '',
    managerEmail: ''
  });

  const [isSelectingManager, setIsSelectingManager] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [managerHierarchicalId, setManagerHierarchicalId] = useState<string>(''); 
  
  // Stan dla modalu z poświadczeniami po utworzeniu
  const [createdCredentials, setCreatedCredentials] = useState<{name: string, email: string, pass: string} | null>(null);

  // Helper do generowania hasła (jeśli user nie wpisze własnego)
  const generateRandomPassword = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let pass = "";
      for (let i = 0; i < 8; i++) {
          pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pass;
  };

  // --- BUDOWANIE DRZEWA DO WYBORU MANAGERA ---
  const structureTree = useMemo(() => {
      const map = new Map<string, TreeNode>();
      const roots: TreeNode[] = [];

      existingUsers.forEach(u => {
          if (u.id.startsWith('admin-')) return;
          map.set(u.email.toLowerCase(), { user: u, children: [] });
      });

      existingUsers.forEach(u => {
          if (u.id.startsWith('admin-')) return;
          const node = map.get(u.email.toLowerCase());
          if (!node) return;

          let mEmail = u.managerEmail ? u.managerEmail.toLowerCase() : '';
          if (mEmail === u.email.toLowerCase()) mEmail = '';

          if (mEmail && map.has(mEmail)) {
              map.get(mEmail)!.children.push(node);
          } else {
              roots.push(node);
          }
      });

      const sortNodes = (nodes: TreeNode[]) => {
          nodes.sort((a, b) => a.user.lastName.localeCompare(b.user.lastName));
          nodes.forEach(n => sortNodes(n.children));
      };
      sortNodes(roots);
      return roots;
  }, [existingUsers]);

  // --- AUTOMATYCZNE GENEROWANIE ID ---
  useEffect(() => {
      if (newUser.role === 'ADMIN') return; 

      const f = newUser.firstName?.trim() || '';
      const l = newUser.lastName?.trim() || '';
      
      if (f && l && managerHierarchicalId) {
          const initials = (f.charAt(0) + l.charAt(0)).toUpperCase();
          const suggestedId = `${managerHierarchicalId}/${initials}`;
          setNewUser(prev => ({ ...prev, hierarchicalId: suggestedId }));
      }
  }, [newUser.firstName, newUser.lastName, managerHierarchicalId, newUser.role]);


  const toggleExpand = (e: React.MouseEvent, email: string) => {
      e.stopPropagation();
      const newSet = new Set(expandedNodes);
      if (newSet.has(email)) newSet.delete(email);
      else newSet.add(email);
      setExpandedNodes(newSet);
  };

  const handleSelectManager = (manager: User) => {
      setNewUser(prev => ({
          ...prev,
          managerName: `${manager.firstName} ${manager.lastName}`,
          managerEmail: manager.email,
          role: prev.role === 'ADMIN' ? 'MANAGER' : prev.role
      }));
      setManagerHierarchicalId(manager.hierarchicalId);
      setIsSelectingManager(false);
  };

  const renderTreeNode = (node: TreeNode, depth: number) => {
      const isExpanded = expandedNodes.has(node.user.email.toLowerCase());
      const hasChildren = node.children.length > 0;
      const levelColor = depth === 0 ? 'text-[#002147]' : (depth === 1 ? 'text-[#C5A059]' : 'text-gray-600');

      return (
          <div key={node.user.id} className="select-none">
              <div 
                  className={`
                      flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors
                      ${newUser.managerEmail === node.user.email ? 'bg-blue-50 border-l-4 border-l-[#002147]' : ''}
                  `}
                  style={{ paddingLeft: `${depth * 20 + 10}px` }}
                  onClick={() => handleSelectManager(node.user)}
              >
                  {hasChildren ? (
                      <span 
                        onClick={(e) => toggleExpand(e, node.user.email.toLowerCase())}
                        className="w-4 h-4 flex items-center justify-center text-[10px] text-gray-400 hover:text-[#C5A059] border border-gray-200 rounded"
                      >
                          {isExpanded ? '▼' : '▶'}
                      </span>
                  ) : (
                      <span className="w-4 h-4"></span>
                  )}
                  
                  <div className="flex flex-col">
                      <span className={`text-xs font-bold ${levelColor}`}>
                          {node.user.firstName} {node.user.lastName}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono">
                          {node.user.hierarchicalId} | {node.user.role}
                      </span>
                  </div>
              </div>
              
              {hasChildren && isExpanded && (
                  <div>
                      {node.children.map(child => renderTreeNode(child, depth + 1))}
                  </div>
              )}
          </div>
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.hierarchicalId) {
        alert("Wypełnij wymagane pola (Imię, Nazwisko, Email, ID)");
        return;
    }
    
    if (!newUser.managerEmail && newUser.role !== 'ADMIN') {
        if (!confirm("UWAGA: Nie wybrano przełożonego dla pracownika niższego szczebla.\nCzy na pewno chcesz utworzyć 'wolny elektron' bez managera?")) {
            return;
        }
    }

    // 1. Ustalenie hasła (wpisane lub losowe)
    const finalPassword = newUser.password?.trim() || generateRandomPassword();

    // 2. Wywołanie onAdd z pełnym obiektem (w tym hasłem)
    onAdd({
        ...newUser,
        password: finalPassword
    });

    // 3. Wyświetlenie modalu z danymi
    setCreatedCredentials({
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        pass: finalPassword
    });

    // 4. Reset formularza
    setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        hierarchicalId: '',
        role: 'USER',
        managerName: '',
        managerEmail: ''
    });
    setManagerHierarchicalId('');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  return (
    <>
        <div className="dynamics-card p-6 border-t-4 border-[#C5A059] bg-white mb-8 shadow-xl">
            <div className="mb-6 border-b border-[#EDEBE9] pb-4 flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#002147] uppercase tracking-tight flex items-center gap-2">
                    <span className="bg-[#C5A059] text-[#002147] w-6 h-6 flex items-center justify-center rounded-full text-xs font-black">+</span>
                    Kreator Nowego Konta
                </h3>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Szybkie dodawanie</span>
            </div>
                
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Lewa kolumna: Dane podstawowe */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Imię" 
                            value={newUser.firstName} 
                            onChange={e => setNewUser({...newUser, firstName: e.target.value})} 
                            required
                            placeholder="Jan"
                        />
                        <Input 
                            label="Nazwisko" 
                            value={newUser.lastName} 
                            onChange={e => setNewUser({...newUser, lastName: e.target.value})} 
                            required
                            placeholder="Kowalski"
                        />
                    </div>
                    
                    <Input 
                        label="Adres E-mail (Login)"
                        type="email"
                        value={newUser.email} 
                        onChange={e => setNewUser({...newUser, email: e.target.value})} 
                        required
                        placeholder="j.kowalski@stratton-prime.pl"
                    />

                    <Select 
                        label="Rola Systemowa"
                        value={newUser.role}
                        onChange={e => {
                            const r = e.target.value as any;
                            setNewUser({...newUser, role: r});
                            if (r === 'ADMIN') {
                                setNewUser(prev => ({...prev, role: r, managerName: '', managerEmail: ''}));
                                setManagerHierarchicalId('');
                            }
                        }}
                        options={[
                            { label: 'Doradca (User)', value: 'USER' },
                            { label: 'Manager (Kierownik)', value: 'MANAGER' },
                            { label: 'Dyrektor (Admin)', value: 'ADMIN' }
                        ]}
                    />
                </div>

                {/* Prawa kolumna: Struktura i ID */}
                <div className="space-y-4">
                    {/* SEKCJA PRZEŁOŻONEGO - TYLKO JEŚLI NIE ADMIN */}
                    {newUser.role !== 'ADMIN' ? (
                        <div className="bg-blue-50/50 p-4 border border-blue-100 rounded relative">
                            <label className="block text-[10px] font-bold uppercase text-[#002147] mb-2 tracking-widest">
                                Przypisz Przełożonego (Struktura)
                            </label>
                            
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Input 
                                        readOnly
                                        value={newUser.managerName || ''}
                                        placeholder="Wybierz z listy..."
                                        className="cursor-pointer bg-white"
                                        onClick={() => setIsSelectingManager(!isSelectingManager)}
                                    />
                                    {newUser.managerName && (
                                        <div className="text-[9px] text-gray-500 mt-1 pl-1">
                                            Email: {newUser.managerEmail}
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    type="button" 
                                    variant={isSelectingManager ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setIsSelectingManager(!isSelectingManager)}
                                    icon={isSelectingManager ? '▲' : '▼'}
                                >
                                    Wybierz
                                </Button>
                            </div>

                            {/* DROPDOWN DRZEWA */}
                            {isSelectingManager && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#002147] shadow-2xl z-50 rounded max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 bg-gray-100 text-[9px] font-bold text-gray-500 uppercase border-b border-gray-200 sticky top-0">
                                        Dostępna Struktura
                                    </div>
                                    {structureTree.map(root => renderTreeNode(root, 0))}
                                    {structureTree.length === 0 && (
                                        <div className="p-4 text-center text-gray-400 text-xs">Brak struktury. Dodaj pierwszego Dyrektora (Admina).</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-[#002147] p-4 border border-[#C5A059] rounded text-white h-[88px] flex items-center justify-center">
                            <div className="text-center">
                                <span className="block text-[10px] uppercase font-bold text-[#C5A059] tracking-widest mb-1">Rola Dyrektorska</span>
                                <span className="text-xs opacity-80">Tworzy nową gałąź (Root). Brak przełożonego.</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Input 
                                label="ID Hierarchiczne (Auto-Generowane)"
                                value={newUser.hierarchicalId} 
                                onChange={e => setNewUser({...newUser, hierarchicalId: e.target.value})} 
                                required
                                className="font-mono font-bold text-[#002147]"
                                description={managerHierarchicalId ? `Sugerowane na podstawie przełożonego: ${managerHierarchicalId}` : 'Wpisz ręcznie lub wybierz przełożonego'}
                            />
                        </div>
                        
                        <div className="col-span-2">
                            <Input 
                                label="Hasło Startowe"
                                value={newUser.password} 
                                onChange={e => setNewUser({...newUser, password: e.target.value})} 
                                placeholder="(Zostaw puste dla losowego)"
                            />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end pt-4 border-t border-[#EDEBE9]">
                    <Button type="submit" variant="primary" size="lg" icon={<ICONS.Check />}>
                        Utwórz Konto i Przypisz
                    </Button>
                </div>
            </form>
        </div>

        {/* MODAL Z POŚWIADCZENIAMI (CREDENTIALS) */}
        {createdCredentials && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border-t-8 border-[#107c10] p-8 animate-in zoom-in-95 duration-300 relative">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 text-[#107c10] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
                            <ICONS.Check />
                        </div>
                        <h3 className="text-xl font-black text-[#002147] uppercase tracking-tight">Konto Utworzone</h3>
                        <p className="text-xs text-gray-500 mt-2">Konto zostało dodane do bazy danych.<br/>Przekaż poniższe dane nowemu pracownikowi.</p>
                    </div>

                    <div className="bg-[#F8F9FA] p-5 rounded border border-[#EDEBE9] space-y-5 mb-8 shadow-inner">
                        <div>
                            <span className="block text-[10px] font-bold uppercase text-[#A19F9D] tracking-widest mb-1">Pracownik</span>
                            <p className="font-bold text-lg text-[#002147]">{createdCredentials.name}</p>
                        </div>
                        
                        <div>
                            <span className="block text-[10px] font-bold uppercase text-[#A19F9D] tracking-widest mb-1">Login (Email)</span>
                            <div className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded">
                                <p className="font-mono text-sm text-[#002147] select-all">{createdCredentials.email}</p>
                                <button 
                                    onClick={() => copyToClipboard(createdCredentials.email)} 
                                    className="text-[#C5A059] hover:text-[#002147] text-[10px] font-bold uppercase px-2"
                                >
                                    KOPIUJ
                                </button>
                            </div>
                        </div>

                        <div>
                            <span className="block text-[10px] font-bold uppercase text-[#A19F9D] tracking-widest mb-1">Hasło Startowe</span>
                            <div className="flex justify-between items-center bg-white border-2 border-[#C5A059]/20 p-3 rounded">
                                <p className="font-mono text-xl font-black text-[#002147] tracking-widest select-all">{createdCredentials.pass}</p>
                                <button 
                                    onClick={() => copyToClipboard(createdCredentials.pass)} 
                                    className="text-[#C5A059] hover:text-[#002147] text-[10px] font-bold uppercase px-2"
                                >
                                    KOPIUJ
                                </button>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1 italic">Hasło jest jednorazowe, zalecana zmiana po pierwszym logowaniu.</p>
                        </div>
                    </div>

                    <Button fullWidth onClick={() => setCreatedCredentials(null)} variant="primary" size="lg">
                        ZAMKNIJ I WRÓĆ DO LISTY
                    </Button>
                </div>
            </div>
        )}
    </>
  );
};
