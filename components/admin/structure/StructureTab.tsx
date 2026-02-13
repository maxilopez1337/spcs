
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { OrgChartNode } from './OrgChartNode';
import { StructureSidebar } from '../users/StructureSidebar'; 
import { User } from '../../../types';
import { toSvg } from 'html-to-image';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ICONS } from '../../../constants';
import { Modal } from '../../Modal';
import { Select } from '../../ui/Select';
import { useToast } from '../../../hooks/useToast';
import { storage } from '../../../services/storage';

interface OrgNode {
  user: User;
  children: OrgNode[];
}

export const StructureTab: React.FC = () => {
  const { users, updateManyUsers, addUser } = useUsers();
  const { addToast } = useToast();
  
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState<number>(0.8);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
  
  // RBAC - Pobieramy aktualnego użytkownika, aby sprawdzić uprawnienia
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
      const u = storage.getCurrentUser();
      setCurrentUser(u);
  }, []);

  // MODAL EDYCJI STRUKTURY
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedNewManager, setSelectedNewManager] = useState<string>('');

  // MODAL DODAWANIA NOWEGO (QUICK ADD)
  const [parentForNewUser, setParentForNewUser] = useState<User | null>(null);
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState<Partial<User> & { city?: string }>({});

  const [globalExpandState, setGlobalExpandState] = useState<boolean | null>(null);
  
  const [selectedViewRootId, setSelectedViewRootId] = useState<string | null>(null);

  // --- AUTOMATYCZNE GENEROWANIE ID ---
  useEffect(() => {
      if (!isCreatingRoot && !parentForNewUser) return;

      const fName = newUserFormData.firstName || '';
      const lName = newUserFormData.lastName || '';
      const city = newUserFormData.city || '';
      const initials = (fName.charAt(0) + lName.charAt(0)).toUpperCase();

      if (isCreatingRoot) {
          if (city.length >= 2 && initials.length === 2) {
              const cityPrefix = city.substring(0, 2).toUpperCase();
              setNewUserFormData(prev => ({ ...prev, hierarchicalId: `${cityPrefix}${initials}` }));
          }
      } else if (parentForNewUser) {
          if (initials.length === 2) {
              setNewUserFormData(prev => ({ 
                  ...prev, 
                  hierarchicalId: `${parentForNewUser.hierarchicalId}/${initials}` 
              }));
          }
      }
  }, [newUserFormData.firstName, newUserFormData.lastName, newUserFormData.city, isCreatingRoot, parentForNewUser]);


  // 1. BUDOWANIE PEŁNEJ STRUKTURY
  const { allRoots, nodeMap } = useMemo(() => {
    const map = new Map<string, OrgNode>();
    const roots: OrgNode[] = [];

    users.forEach(u => {
        if (u.id.startsWith('admin-') || u.id === 'test-user-dev') return; 
        const email = u.email ? u.email.trim().toLowerCase() : '';
        if (email) map.set(email, { user: u, children: [] });
    });

    users.forEach(u => {
        if (u.id.startsWith('admin-') || u.id === 'test-user-dev') return;
        
        const email = u.email ? u.email.trim().toLowerCase() : '';
        const node = map.get(email);
        if (!node) return;
        
        let managerEmail = u.managerEmail ? u.managerEmail.trim().toLowerCase() : '';
        if (managerEmail === email) managerEmail = ''; 

        const managerNode = managerEmail ? map.get(managerEmail) : null;

        if (managerNode) {
            let currentPtr = managerNode.user;
            let isCycle = false;
            let depthCheck = 0;
            while(currentPtr.managerEmail && depthCheck < 50) {
                const ptrManagerEmail = currentPtr.managerEmail.trim().toLowerCase();
                if (ptrManagerEmail === email) { isCycle = true; break; }
                const nextManager = map.get(ptrManagerEmail);
                if (!nextManager) break;
                currentPtr = nextManager.user;
                depthCheck++;
            }

            if (isCycle) roots.push(node);
            else managerNode.children.push(node);
        } else {
            roots.push(node);
        }
    });
    
    roots.sort((a, b) => a.user.lastName.localeCompare(b.user.lastName));
    return { allRoots: roots, nodeMap: map };
  }, [users]);


  // 2. OBLICZANIE WIDOCZNEJ STRUKTURY
  const displayedStructure = useMemo(() => {
      if (selectedViewRootId) {
          const selectedUser = users.find(u => u.id === selectedViewRootId);
          if (selectedUser) {
              const node = nodeMap.get(selectedUser.email.toLowerCase().trim());
              if (node) return [node];
          }
      }
      return allRoots;
  }, [selectedViewRootId, allRoots, nodeMap, users]);


  // --- HANDLERS ---

  const handleSidebarSelect = (user: User | null) => {
      if (!user) {
          setSelectedViewRootId(null);
          addToast('info', 'Widok', 'Pokazuję całą strukturę organizacji.');
      } else {
          setSelectedViewRootId(user.id);
          setGlobalExpandState(true); 
          setZoom(1.0); 
          addToast('success', 'Filtrowanie', `Struktura: ${user.firstName} ${user.lastName}`);
      }
      
      if (containerRef.current) {
          containerRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
      }
  };

  // RBAC: Sprawdzenie uprawnień przed dodaniem
  const handleAddChildClick = (parent: User) => {
      if (!isAdmin) {
          addToast('error', 'Brak Uprawnień', 'Tylko Super Admin może modyfikować strukturę.');
          return;
      }
      setParentForNewUser(parent);
      setIsCreatingRoot(false);
      setNewUserFormData({
          managerEmail: parent.email,
          managerName: `${parent.firstName} ${parent.lastName}`,
          role: 'USER',
          firstName: '', lastName: '', email: ''
      });
  };

  const handleCreateRootClick = () => {
      setParentForNewUser(null);
      setIsCreatingRoot(true);
      setNewUserFormData({
          managerEmail: '',
          managerName: '',
          role: 'ADMIN',
          city: '',
          firstName: '', lastName: '', email: ''
      });
  };

  const submitNewUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAdmin) return; // RBAC Check

      if (!newUserFormData.email || !newUserFormData.firstName || !newUserFormData.lastName || !newUserFormData.hierarchicalId) {
          addToast('error', 'Błąd', 'Wypełnij wszystkie pola.');
          return;
      }
      
      const { city, ...userToSave } = newUserFormData;
      addUser(userToSave);
      addToast('success', 'Dodano', `Utworzono: ${userToSave.firstName} ${userToSave.lastName}`);
      setParentForNewUser(null);
      setIsCreatingRoot(false);
      setNewUserFormData({});
  };

  const getAllDescendants = (managerEmail: string, allUsers: User[]): User[] => {
      const directReports = allUsers.filter(u => u.managerEmail?.toLowerCase().trim() === managerEmail.toLowerCase().trim());
      let descendants = [...directReports];
      directReports.forEach(report => {
          descendants = [...descendants, ...getAllDescendants(report.email, allUsers)];
      });
      return descendants;
  };

  const calculateStructureUpdates = (draggedUserId: string, newManagerEmail: string) => {
      const draggedUser = users.find(u => u.id === draggedUserId);
      const newManager = users.find(u => u.email.toLowerCase().trim() === newManagerEmail.toLowerCase().trim());
      
      if (!draggedUser || !newManager) return null;
      if (draggedUser.email.toLowerCase() === newManagerEmail.toLowerCase()) return null;

      const descendantsCheck = getAllDescendants(draggedUser.email, users);
      if (descendantsCheck.some(d => d.email.toLowerCase() === newManager.email.toLowerCase())) {
          addToast('error', 'Błąd Hierarchii', 'Pętla przełożonych.');
          return null;
      }

      const idSegments = draggedUser.hierarchicalId.split('/');
      const userSuffix = idSegments.length > 0 ? idSegments[idSegments.length - 1] : draggedUser.hierarchicalId;
      const newHierarchicalId = `${newManager.hierarchicalId}/${userSuffix}`;

      const usersToUpdate: User[] = [];
      const updatedDraggedUser: User = {
          ...draggedUser,
          managerEmail: newManager.email, 
          managerName: `${newManager.firstName} ${newManager.lastName}`,
          hierarchicalId: newHierarchicalId
      };
      usersToUpdate.push(updatedDraggedUser);

      const descendantMap = new Map<string, User[]>();
      users.forEach(u => {
          if (u.managerEmail) {
              const mEmail = u.managerEmail.trim().toLowerCase();
              if (!descendantMap.has(mEmail)) descendantMap.set(mEmail, []);
              descendantMap.get(mEmail)!.push(u);
          }
      });

      const updateChildrenIds = (parentUser: User) => {
          const children = descendantMap.get(parentUser.email.trim().toLowerCase()) || [];
          children.forEach(child => {
              const childSegments = child.hierarchicalId.split('/');
              const childSuffix = childSegments.length > 0 ? childSegments[childSegments.length - 1] : child.hierarchicalId;
              const newChildId = `${parentUser.hierarchicalId}/${childSuffix}`;
              
              const updatedChild = {
                  ...child,
                  hierarchicalId: newChildId,
                  managerName: `${parentUser.firstName} ${parentUser.lastName}`,
                  managerEmail: parentUser.email
              };
              usersToUpdate.push(updatedChild);
              updateChildrenIds(updatedChild);
          });
      };
      updateChildrenIds(updatedDraggedUser);

      return { usersToUpdate, newHierarchicalId, newManagerName: `${newManager.firstName} ${newManager.lastName}` };
  };

  const handleDragDropMove = (draggedUserId: string, newManagerEmail: string) => {
      if (!isAdmin) {
          addToast('error', 'Brak Uprawnień', 'Tylko Super Admin może zmieniać strukturę metodą Drag & Drop.');
          return;
      }
      const calculation = calculateStructureUpdates(draggedUserId, newManagerEmail);
      if (!calculation) return;
      if (confirm(`Przenieść pracownika do: ${calculation.newManagerName}?`)) {
          updateManyUsers(calculation.usersToUpdate);
          addToast('success', 'Przeniesiono', 'Struktura zaktualizowana.');
      }
  };

  const handleModalSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAdmin) return; // RBAC Check

      if (!editingUser || !selectedNewManager) return;
      const calculation = calculateStructureUpdates(editingUser.id, selectedNewManager);
      if (!calculation) return;
      updateManyUsers(calculation.usersToUpdate);
      setEditingUser(null);
      addToast('success', 'Zaktualizowano', 'Zmieniono przełożonego.');
  };

  // RBAC Wrapper dla edycji
  const handleEditUser = (user: User) => {
      if (!isAdmin) {
          addToast('error', 'Brak Uprawnień', 'Tylko Super Admin może edytować powiązania.');
          return;
      }
      setEditingUser(user);
  };

  const availableManagers = useMemo(() => {
      if (!editingUser) return [];
      return users.filter(u => {
          if (u.id === editingUser.id) return false; 
          if (u.role === 'ADMIN' && u.id.startsWith('admin-')) return false; 
          if (u.hierarchicalId.startsWith(editingUser.hierarchicalId + '/')) return false;
          return true;
      }).sort((a,b) => a.lastName.localeCompare(b.lastName));
  }, [users, editingUser]);

  // Zoom & Pan
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const centerView = () => {
      if (containerRef.current && chartRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const contentWidth = chartRef.current.scrollWidth;
          const scrollLeft = (contentWidth - containerWidth) / 2;
          containerRef.current.scrollTo({ left: scrollLeft > 0 ? scrollLeft : 0, top: 0, behavior: 'smooth' });
          setZoom(0.8);
      }
  };
  const handleMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.relative')) return;
      if ((e.target as HTMLElement).closest('button')) return;
      if ((e.target as HTMLElement).closest('input')) return;
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
      if (containerRef.current) setScrollStart({ left: containerRef.current.scrollLeft, top: containerRef.current.scrollTop });
      document.body.style.cursor = 'grabbing';
  };
  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isPanning || !containerRef.current) return;
      e.preventDefault();
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;
      containerRef.current.scrollLeft = scrollStart.left - dx;
      containerRef.current.scrollTop = scrollStart.top - dy;
  };
  const handleMouseUp = () => { setIsPanning(false); document.body.style.cursor = 'default'; };
  
  // FIX: EXPORT CAŁOŚCI (BEZ UCINANIA)
  const handleExport = async () => {
    if (!chartRef.current) return;
    try {
        const loadingToastId = Math.random().toString();
        addToast('info', 'Eksport', 'Generowanie pliku SVG...');

        // 1. Zapisz obecny stan
        const originalTransform = chartRef.current.style.transform;
        
        // 2. Reset transformacji, aby pobrać faktyczne wymiary
        // Ustawiamy transform na 'none' aby zmierzyć pełny rozmiar kontentu bez skalowania
        chartRef.current.style.transform = 'none';
        
        // 3. Pobierz wymiary całkowite (scrollWidth/Height obejmuje wszystko, nawet to co niewidoczne)
        const fullWidth = chartRef.current.scrollWidth + 100; // Margines
        const fullHeight = chartRef.current.scrollHeight + 100;

        // 4. Generuj SVG z wymuszonymi wymiarami
        const dataUrl = await toSvg(chartRef.current, { 
            backgroundColor: '#ffffff', 
            width: fullWidth,
            height: fullHeight,
            style: { 
                transform: 'scale(1)', // Eksportujemy w skali 1:1
                transformOrigin: 'top left'
            } 
        });

        // 5. Przywróć stan widoku
        chartRef.current.style.transform = originalTransform;

        const link = document.createElement('a');
        link.download = `struktura_organizacyjna_${new Date().toISOString().split('T')[0]}.svg`; 
        link.href = dataUrl; 
        link.click();
        
        addToast('success', 'Sukces', 'Plik pobrany.');
    } catch (e) {
        console.error(e);
        addToast('error', 'Błąd', 'Nie udało się wygenerować pliku.');
        if (chartRef.current) chartRef.current.style.transform = `scale(${zoom})`; // Fallback restore
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] animate-in fade-in duration-500 gap-4">
      
      {/* 1. SIDEBAR NAWIGACYJNY */}
      <div className="w-[280px] flex-shrink-0 bg-white shadow-lg border-t-4 border-[#002147] rounded-sm hidden md:block overflow-hidden h-full">
          <StructureSidebar 
              users={users} 
              selectedId={selectedViewRootId}
              onSelect={handleSidebarSelect}
          />
      </div>

      {/* 2. GŁÓWNY OBSZAR WYKRESU */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0 h-full">
          {/* PASEK NARZĘDZI */}
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-4 dynamics-card border-l-4 border-[#C5A059] flex-shrink-0">
             <div>
                <h2 className="text-lg font-bold text-[#002147] uppercase tracking-tight">
                    {selectedViewRootId ? 'Widok Zespołu' : 'Główna Struktura Organizacyjna'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    {isAdmin ? (
                        <span className="px-2 py-0.5 bg-[#002147] text-white text-[9px] font-bold rounded uppercase">Tryb Administratora</span>
                    ) : (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-bold rounded uppercase">Tryb Podglądu (RBAC)</span>
                    )}
                    <p className="text-[10px] text-[#605E5C]">
                        {selectedViewRootId 
                            ? 'Filtrowanie aktywne.'
                            : 'Widok wszystkich dyrektorów.'
                        }
                    </p>
                </div>
             </div>
             
             <div className="flex items-center gap-3 ml-auto">
                {isAdmin && (
                    <Button variant="secondary" size="sm" onClick={handleCreateRootClick}>+ Nowy Dyrektor</Button>
                )}
                
                <div className="h-8 w-px bg-gray-200 mx-1"></div>
                <div className="flex bg-[#F3F2F1] rounded p-1 border border-[#EDEBE9]">
                    <button onClick={handleZoomOut} className="w-8 font-bold hover:bg-gray-200 rounded">-</button>
                    <span className="text-[10px] font-mono w-10 text-center py-1">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} className="w-8 font-bold hover:bg-gray-200 rounded">+</button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setGlobalExpandState(true)}>Rozwiń</Button>
                <Button variant="outline" size="sm" onClick={() => setGlobalExpandState(false)}>Zwiń</Button>
                <Button variant="ghost" size="sm" onClick={centerView}>Centruj</Button>
                <Button variant="primary" size="sm" onClick={handleExport} icon={<ICONS.Download />}>SVG</Button>
             </div>
          </div>

          {/* OBSZAR CANVAS */}
          {/* Dodano 'overflow-auto' i 'min-w-0' aby kontener scrollowalny dzialal poprawnie */}
          <div ref={containerRef} className="dynamics-card bg-gray-50 flex-1 overflow-auto border-t-4 border-[#002147] relative cursor-grab active:cursor-grabbing shadow-inner h-full w-full"
            style={{ backgroundImage: 'radial-gradient(#C5A059 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
             
             {/* Wewnętrzny kontener musi mieć możliwość rozszerzania się poza viewport (min-w-fit) aby nie ucinało treści przy zoomie/panowaniu */}
             <div 
                ref={chartRef} 
                className="p-20 transition-transform duration-200 ease-out origin-top-left inline-block min-w-max min-h-max" 
                style={{ transform: `scale(${zoom})` }}
             >
                {displayedStructure.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 opacity-50 w-full">
                        <div className="text-6xl mb-4">🗂️</div>
                        <div className="text-xl font-bold text-[#002147]">Brak struktury do wyświetlenia</div>
                        <p className="text-sm text-gray-500 mt-2">Dodaj pierwszego dyrektora lub wybierz inną gałąź.</p>
                    </div>
                ) : (
                    <div className="flex gap-20 items-start justify-center">
                        {displayedStructure.map(root => (
                            <OrgChartNode 
                                key={root.user.id} 
                                node={root} 
                                depth={0} 
                                onMoveUser={handleDragDropMove} 
                                onEditUser={handleEditUser} // Używamywrappera z RBAC
                                onAddChild={handleAddChildClick} // Używamy wrappera z RBAC
                                globalExpandState={globalExpandState}
                                highlightedUserId={null}
                                readOnly={!isAdmin} // Przekazujemy flagę readOnly
                            />
                        ))}
                    </div>
                )}
             </div>
          </div>
      </div>

      {/* MODALE (Widoczne tylko dla admina, bo tylko on może wywołać akcję otwierającą) */}
      {editingUser && isAdmin && (
          <Modal title="Przeniesienie Pracownika" onClose={() => setEditingUser(null)} maxWidth="max-w-md" borderColor="navy">
              <form onSubmit={handleModalSave} className="space-y-6">
                  <div className="bg-[#F3F2F1] p-4 rounded"><p className="text-lg font-black text-[#002147]">{editingUser.firstName} {editingUser.lastName}</p></div>
                  <Select label="Nowy Przełożony" value={selectedNewManager} onChange={e => setSelectedNewManager(e.target.value)}
                    options={[{ label: '-- Wybierz --', value: '' }, ...availableManagers.map(m => ({ label: `${m.firstName} ${m.lastName}`, value: m.email }))]} required />
                  <div className="flex gap-3 pt-4 border-t border-[#EDEBE9]">
                      <Button type="button" variant="outline" fullWidth onClick={() => setEditingUser(null)}>Anuluj</Button>
                      <Button type="submit" variant="primary" fullWidth disabled={!selectedNewManager}>Zapisz</Button>
                  </div>
              </form>
          </Modal>
      )}

      {(parentForNewUser || isCreatingRoot) && isAdmin && (
          <Modal title={isCreatingRoot ? "Nowy Dyrektor / Struktura" : "Szybkie Dodawanie do Struktury"} onClose={() => { setParentForNewUser(null); setIsCreatingRoot(false); }} maxWidth="max-w-md" borderColor="gold">
              <form onSubmit={submitNewUser} className="space-y-4">
                  {!isCreatingRoot && parentForNewUser && (
                      <div className="bg-blue-50 p-4 border-l-4 border-[#002147]">
                          <p className="text-[10px] font-bold uppercase text-[#002147]">Przełożony</p>
                          <p className="text-sm font-bold">{parentForNewUser.firstName} {parentForNewUser.lastName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">ID: {parentForNewUser.hierarchicalId}</p>
                      </div>
                  )}
                  {isCreatingRoot && (
                      <div className="bg-[#002147] p-4 border-l-4 border-[#C5A059] text-white">
                          <p className="text-[10px] font-bold uppercase text-[#C5A059]">Nowa Struktura</p>
                          <p className="text-sm">Wprowadź miasto i dane, system wygeneruje ID (np. Gdańsk + Jan Nowak = GDJN).</p>
                      </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                      <Input label="Imię" value={newUserFormData.firstName || ''} onChange={e => setNewUserFormData({...newUserFormData, firstName: e.target.value})} required autoFocus />
                      <Input label="Nazwisko" value={newUserFormData.lastName || ''} onChange={e => setNewUserFormData({...newUserFormData, lastName: e.target.value})} required />
                  </div>

                  {isCreatingRoot && (
                      <Input 
                        label="Miasto (Baza Struktury)" 
                        value={newUserFormData.city || ''} 
                        onChange={e => setNewUserFormData({...newUserFormData, city: e.target.value})} 
                        placeholder="np. Warszawa, Gdańsk..."
                        required
                        description="Pierwsze 2 litery miasta utworzą prefix ID."
                      />
                  )}
                  
                  <Input label="Email (Login)" value={newUserFormData.email || ''} onChange={e => setNewUserFormData({...newUserFormData, email: e.target.value})} required />
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="w-full">
                          <label className="block text-[10px] font-bold uppercase text-[#002147] mb-1.5 tracking-widest">
                              Automatyczne ID
                          </label>
                          <input 
                              disabled
                              value={newUserFormData.hierarchicalId || '...'}
                              className="w-full bg-[#F3F2F1] text-[#C5A059] border border-[#D1D1D1] rounded-sm px-4 py-3 outline-none font-mono font-bold text-sm"
                          />
                      </div>
                      <Select label="Rola" value={newUserFormData.role || 'USER'} onChange={e => setNewUserFormData({...newUserFormData, role: e.target.value as any})}
                          options={[{ label: 'DORADCA', value: 'USER' }, { label: 'MANAGER', value: 'MANAGER' }, { label: 'ADMIN (Dyrektor)', value: 'ADMIN' }]} />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#EDEBE9]">
                      <Button type="button" variant="outline" fullWidth onClick={() => { setParentForNewUser(null); setIsCreatingRoot(false); }}>Anuluj</Button>
                      <Button type="submit" variant="primary" fullWidth>{isCreatingRoot ? 'Utwórz Strukturę' : 'Dodaj do Drzewa'}</Button>
                  </div>
              </form>
          </Modal>
      )}
    </div>
  );
};
