
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { useResults } from '../../../hooks/useResults';
import { UserList } from './UserList';
import { AddUserForm } from './AddUserForm';
import { ImportPreviewModal } from './ImportPreviewModal';
import { StructureSidebar } from './StructureSidebar';
import { User } from '../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { ICONS } from '../../../constants';

export const UsersTab: React.FC = () => {
  const { 
    users, 
    addUser,
    addManyUsers, 
    updateUser, 
    deleteUser, 
    deleteSelectedUsers, 
    parseExcelFile, 
    exportUsersToExcel, 
    resetUserPassword
  } = useUsers();

  const { results } = useResults();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(30);
  const [importPreviewData, setImportPreviewData] = useState<User[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'MANAGER' | 'ADMIN'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [selectedStructureRoot, setSelectedStructureRoot] = useState<User | null>(null);

  const userImportRef = useRef<HTMLInputElement>(null);

  // --- LOGIKA CERTYFIKACJI ---
  const certificationMap = useMemo(() => {
      const map = new Map<string, { passed: boolean; attempts: number; maxScore: number; lastDate: string }>();
      
      const userResults = new Map<string, typeof results>();
      results.forEach(r => {
          const email = r.email.toLowerCase().trim();
          if (!userResults.has(email)) userResults.set(email, []);
          userResults.get(email)!.push(r);
      });

      userResults.forEach((attemptsArr, email) => {
          const passedExam = attemptsArr.find(a => a.passed);
          const maxScore = Math.max(...attemptsArr.map(a => a.score));
          const lastAttempt = attemptsArr[attemptsArr.length - 1]; 

          if (passedExam) {
              map.set(email, { 
                  passed: true, 
                  attempts: attemptsArr.length, 
                  maxScore: passedExam.score, 
                  lastDate: passedExam.date 
              });
          } else {
              map.set(email, { 
                  passed: false, 
                  attempts: attemptsArr.length, 
                  maxScore: maxScore, 
                  lastDate: lastAttempt?.date || '-' 
              });
          }
      });
      return map;
  }, [results]);

  // ZAAWANSOWANE FILTROWANIE
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        searchQuery === '' || 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.hierarchicalId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

      let matchesStructure = true;
      if (selectedStructureRoot) {
          matchesStructure = user.hierarchicalId.startsWith(selectedStructureRoot.hierarchicalId);
      }

      return matchesSearch && matchesRole && matchesStructure;
    });
  }, [users, searchQuery, roleFilter, selectedStructureRoot]);

  useEffect(() => {
    setCurrentPage(1);
  }, [users.length, searchQuery, roleFilter, usersPerPage, selectedStructureRoot]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const parsedUsers = await parseExcelFile(e.target.files[0]);
        setImportPreviewData(parsedUsers);
        e.target.value = '';
      } catch (err) {
        alert("Błąd importu pliku Excel.");
        console.error(err);
      }
    }
  };

  const handleImportConfirm = (confirmedUsers: User[]) => {
      if (confirmedUsers.length > 0) {
          addManyUsers(confirmedUsers);
          alert(`Sukces! Dodano ${confirmedUsers.length} pracowników do bazy.`);
      }
      setImportPreviewData(null);
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
        const newSet = new Set(selectedIds);
        paginatedUsers.forEach(u => newSet.add(u.id));
        setSelectedIds(newSet);
    } else {
        const newSet = new Set(selectedIds);
        paginatedUsers.forEach(u => newSet.delete(u.id));
        setSelectedIds(newSet);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    deleteSelectedUsers(selectedIds);
    setSelectedIds(new Set()); 
  };

  const handleDeleteOne = (id: string) => {
    deleteUser(id);
    if (selectedIds.has(id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
    }
  };

  const handleResetPassword = (id: string, email: string) => {
    if(confirm(`Czy na pewno wygenerować nowe hasło dla użytkownika ${email}?`)) {
        const newPass = resetUserPassword(id);
        alert(`Nowe hasło dla ${email}: ${newPass}`);
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    updateUser(updatedUser);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* GÓRNY PASEK AKCJI */}
      <div className="bg-white p-4 shadow-sm border border-[#EDEBE9] flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4 sticky top-0 z-20">
         <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-end">
            <div className="w-full sm:w-72">
                <div className="relative group">
                    <Input 
                        placeholder="Szukaj (Nazwisko, Email, ID)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-8 bg-[#F3F2F1] border-transparent focus:bg-white focus:border-[#C5A059] focus:ring-0 transition-colors"
                    />
                    <div className="absolute left-3 top-3.5 text-[#605E5C] group-focus-within:text-[#C5A059] transition-colors">
                        <ICONS.Search />
                    </div>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
            <div className="w-full sm:w-48">
                <Select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    options={[
                        { label: 'Wszystkie Role', value: 'ALL' },
                        { label: 'Doradcy', value: 'USER' },
                        { label: 'Managerowie', value: 'MANAGER' },
                        { label: 'Admini', value: 'ADMIN' }
                    ]}
                    className="bg-[#F3F2F1] border-none font-bold"
                />
            </div>
         </div>

         <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
            <Button 
                variant={showAddForm ? 'secondary' : 'outline'} 
                size="sm" 
                onClick={() => setShowAddForm(!showAddForm)}
            >
                {showAddForm ? 'Zamknij Formularz' : '+ Nowy Pracownik'}
            </Button>
            
            <div className="h-8 w-px bg-[#EDEBE9] mx-1 hidden sm:block"></div>

            <input type="file" ref={userImportRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
            <Button variant="ghost" size="sm" onClick={() => userImportRef.current?.click()} icon={<ICONS.Upload />}>
                Import
            </Button>
            <Button variant="ghost" size="sm" onClick={exportUsersToExcel}>
                Eksport
            </Button>

            {selectedIds.size > 0 && (
                <Button variant="danger" size="sm" onClick={handleDeleteSelected} className="animate-in zoom-in">
                    Usuń ({selectedIds.size})
                </Button>
            )}
         </div>
      </div>

      {showAddForm && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            {/* Przekazujemy listę users do formularza, aby móc zbudować drzewo wyboru managera */}
            <AddUserForm onAdd={addUser} existingUsers={users} />
          </div>
      )}

      {/* GŁÓWNY UKŁAD: SIDEBAR + LISTA */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEWA KOLUMNA: NAWIGATOR STRUKTURY */}
          <div className="w-full lg:w-1/4 min-w-[280px] bg-white shadow-lg border-t-4 border-[#002147] rounded-sm h-[calc(100vh-250px)] sticky top-24 overflow-hidden">
              <StructureSidebar 
                  users={users} 
                  selectedId={selectedStructureRoot?.hierarchicalId || null}
                  onSelect={setSelectedStructureRoot}
              />
          </div>

          {/* PRAWA KOLUMNA: TABELA */}
          <div className="flex-1 w-full min-w-0">
              <div className="flex justify-between items-center px-1 mb-2">
                 <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest">
                        {selectedStructureRoot 
                            ? `Struktura: ${selectedStructureRoot.firstName} ${selectedStructureRoot.lastName} (${selectedStructureRoot.hierarchicalId})` 
                            : 'Cała Organizacja'
                        }
                     </span>
                     {selectedStructureRoot && (
                         <button 
                            onClick={() => setSelectedStructureRoot(null)} 
                            className="text-[9px] text-red-500 hover:underline uppercase font-bold"
                         >
                             [Wyczyść filtr]
                         </button>
                     )}
                 </div>
                 <span className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-widest">
                    Wyników: {filteredUsers.length}
                 </span>
              </div>

              <UserList 
                users={paginatedUsers} 
                selectedIds={selectedIds}
                startIndex={startIndex}
                certificationMap={certificationMap} 
                onUpdateUser={handleUpdateUser} 
                onDelete={handleDeleteOne}
                onResetPassword={handleResetPassword}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleSelectOne={handleToggleSelectOne}
              />

              {/* Paginacja */}
              <div className="flex justify-between items-center p-4 bg-white border border-[#EDEBE9] shadow-sm mt-4">
                 <div className="flex items-center gap-2">
                     <span className="text-[10px] text-[#605E5C] uppercase font-bold">Wierszy:</span>
                     <Select 
                        value={usersPerPage}
                        onChange={(e) => setUsersPerPage(Number(e.target.value))}
                        options={[
                            { label: '10', value: 10 },
                            { label: '30', value: 30 },
                            { label: '50', value: 50 },
                            { label: '100', value: 100 }
                        ]}
                        className="py-1 w-20 text-xs bg-[#F3F2F1] border-none"
                     />
                 </div>

                 <div className="flex gap-2">
                     <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                     >
                        Poprzednia
                     </Button>
                     <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                     >
                        Następna
                     </Button>
                 </div>
              </div>
          </div>
      </div>

      {importPreviewData && (
          <ImportPreviewModal 
            users={importPreviewData}
            onConfirm={handleImportConfirm}
            onCancel={() => setImportPreviewData(null)}
          />
      )}
    </div>
  );
};
