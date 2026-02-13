
import React, { useMemo, useState } from 'react';
import { User } from '../../../types';
import { ICONS } from '../../../constants';

interface StructureSidebarProps {
    users: User[];
    selectedId: string | null;
    onSelect: (user: User | null) => void;
}

interface TreeNode {
    user: User;
    children: TreeNode[];
}

export const StructureSidebar: React.FC<StructureSidebarProps> = ({ users, selectedId, onSelect }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Budowanie drzewa
    const tree = useMemo(() => {
        const userMap = new Map<string, TreeNode>();
        const roots: TreeNode[] = [];

        // 1. Tworzenie węzłów
        users.forEach(u => {
            if (u.role === 'ADMIN' && u.id.startsWith('admin-')) return; // Ukryj systemowych
            userMap.set(u.email.toLowerCase(), { user: u, children: [] });
        });

        // 2. Łączenie w drzewo
        users.forEach(u => {
            if (u.role === 'ADMIN' && u.id.startsWith('admin-')) return;
            
            const node = userMap.get(u.email.toLowerCase());
            if (!node) return;

            let managerEmail = u.managerEmail ? u.managerEmail.toLowerCase() : '';
            if (managerEmail === u.email.toLowerCase()) managerEmail = '';

            if (managerEmail && userMap.has(managerEmail)) {
                userMap.get(managerEmail)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // Sortowanie
        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => a.user.lastName.localeCompare(b.user.lastName));
            nodes.forEach(n => sortNodes(n.children));
        };
        sortNodes(roots);
        return roots;
    }, [users]);

    const toggleExpand = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const newSet = new Set(expandedNodes);
        if (newSet.has(nodeId)) newSet.delete(nodeId);
        else newSet.add(nodeId);
        setExpandedNodes(newSet);
    };

    // 1. KOLOR GAŁĘZI (Border)
    const getBranchColor = (hierarchicalId: string) => {
        const parts = hierarchicalId.split('/');
        if (parts.length === 1) return '#002147'; // ROOT

        const branchKey = parts[1];
        const palette: Record<string, string> = {
            'JA': '#059669', // Emerald
            'NK': '#7C3AED', // Violet
            'TP': '#DC2626', // Red
            'KR': '#2563EB', // Blue
            'TL': '#D97706', // Amber
            'MJ': '#0891B2', // Cyan
            'PD': '#DB2777', // Pink
        };
        return palette[branchKey] || '#6B7280';
    };

    // 2. KOLOR ROLI (Tekst)
    const getRoleColor = (hierarchicalId: string) => {
        const level = (hierarchicalId.match(/\//g) || []).length;
        switch (level) {
            case 0: return '#002147'; // Granatowy
            case 1: return '#C5A059'; // Złoty
            case 2: return '#4B5563'; // Szary
            default: return '#0078D4'; // Niebieski
        }
    };

    const renderNode = (node: TreeNode, depth: number) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes.has(node.user.id);
        const isSelected = selectedId === node.user.hierarchicalId;

        const branchColor = getBranchColor(node.user.hierarchicalId);
        const roleColor = getRoleColor(node.user.hierarchicalId);

        return (
            <div key={node.user.id} className="select-none">
                <div 
                    className={`
                        flex items-center gap-2 p-2 rounded-r-md cursor-pointer transition-all duration-200 border-l-[4px] my-1 relative
                        ${isSelected ? 'shadow-sm bg-gray-50' : 'hover:bg-gray-50 border-transparent'}
                    `}
                    // Border lewy = GAŁĄŹ
                    style={{ 
                        marginLeft: `${depth * 12}px`,
                        borderLeftColor: isSelected ? branchColor : 'transparent',
                    }}
                    onClick={() => onSelect(node.user)}
                >
                    {/* Wskaźnik koloru gałęzi dla nieaktywnych */}
                    {!isSelected && (
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-sm"
                            style={{ backgroundColor: branchColor, opacity: 0.3 }}
                        ></div>
                    )}

                    {/* Ikona rozwijania */}
                    <div 
                        className={`w-4 h-4 flex items-center justify-center rounded hover:bg-black/5 transition-colors ${hasChildren ? 'visible' : 'invisible'} text-gray-400`}
                        onClick={(e) => toggleExpand(e, node.user.id)}
                    >
                        <span className={`text-[8px] font-bold transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    </div>

                    {/* Treść */}
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                            {/* Nazwisko w kolorze ROLI */}
                            <span 
                                className={`text-xs font-bold truncate ${isSelected ? '' : 'text-[#323130]'}`}
                                style={{ color: isSelected ? roleColor : undefined }}
                            >
                                {node.user.firstName} {node.user.lastName}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                            <span className="text-[9px] font-mono truncate text-gray-400">{node.user.hierarchicalId}</span>
                            {hasChildren && (
                                <span 
                                    className="text-[8px] px-1.5 rounded-full font-bold text-white"
                                    // Licznik w kolorze ROLI
                                    style={{ backgroundColor: roleColor }}
                                >
                                    {node.children.length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dzieci */}
                {hasChildren && isExpanded && (
                    <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white border-r border-[#EDEBE9]">
            <div className="p-4 border-b border-[#EDEBE9] bg-[#FAF9F8]">
                <h3 className="text-xs font-black uppercase text-[#002147] tracking-widest flex items-center gap-2">
                    <ICONS.Structure /> Struktura Firmy
                </h3>
                <p className="text-[9px] text-[#605E5C] mt-1">Legenda: <span className="text-[#002147] font-bold">Dyr. Struktury</span> | <span className="text-[#C5A059] font-bold">Dyr. Manager</span> | <span className="text-gray-500 font-bold">Mgr.</span> | <span className="text-[#0078D4] font-bold">Doradca</span></p>
                <p className="text-[8px] text-gray-400 mt-0.5">* Paski boczne oznaczają przynależność do gałęzi</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <div 
                    className={`
                        flex items-center gap-2 p-2 rounded-md cursor-pointer mb-2 border-l-4 transition-colors
                        ${selectedId === null ? 'bg-[#002147] text-white border-[#C5A059]' : 'hover:bg-gray-50 border-transparent text-[#605E5C]'}
                    `}
                    onClick={() => onSelect(null)}
                >
                    <div className="w-4"></div>
                    <span className="text-xs font-bold uppercase tracking-wide">Cała Organizacja</span>
                </div>

                {tree.map(root => renderNode(root, 0))}
            </div>
        </div>
    );
};
