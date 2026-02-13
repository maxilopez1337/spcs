
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../../types';
import { ICONS } from '../../../constants';

interface OrgNode {
  user: User;
  children: OrgNode[];
}

interface OrgChartNodeProps {
  node: OrgNode;
  depth: number; 
  onMoveUser: (draggedUserId: string, newManagerEmail: string) => void;
  onEditUser: (user: User) => void;
  onAddChild: (parentUser: User) => void;
  globalExpandState: boolean | null;
  highlightedUserId: string | null;
  readOnly: boolean;
}

export const OrgChartNode: React.FC<OrgChartNodeProps> = ({ 
  node, 
  depth, 
  onMoveUser, 
  onEditUser, 
  onAddChild,
  globalExpandState,
  highlightedUserId,
  readOnly
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const hasChildren = node.children.length > 0;
  
  const isHighlighted = node.user.id === highlightedUserId;

  // OBLICZANIE ABSOLUTNEGO POZIOMU W FIRMIE
  const absoluteLevel = (node.user.hierarchicalId.match(/\//g) || []).length;

  useEffect(() => {
      if (globalExpandState !== null) {
          setExpanded(globalExpandState);
      }
  }, [globalExpandState]);

  useEffect(() => {
      if (isHighlighted && nodeRef.current) {
          setShowDetails(true);
          if (hasChildren) setExpanded(true);
          
          setTimeout(() => {
              nodeRef.current?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center', 
                  inline: 'center' 
              });
          }, 100);
      }
  }, [isHighlighted, hasChildren]);

  // --- 1. KOLOR GAŁĘZI (ZESPOŁU) ---
  const getBranchColor = (hierarchicalId: string) => {
      const parts = hierarchicalId.split('/');
      if (parts.length === 1) return '#002147'; // ROOT (Granatowy)
      const branchKey = parts[1]; // GAŁĄŹ (np. JA, NK, TP)
      
      const palette: Record<string, string> = {
          'JA': '#059669', // Emerald
          'NK': '#7C3AED', // Violet
          'TP': '#DC2626', // Red
          'KR': '#2563EB', // Blue
          'TL': '#D97706', // Amber
          'MJ': '#0891B2', // Cyan
          'PD': '#DB2777', // Pink
      };
      return palette[branchKey] || '#6B7280'; // Default Grey
  };

  const branchColor = getBranchColor(node.user.hierarchicalId);

  // --- 2. KOLOR ROLI (RANGI) ---
  const getRoleColor = (lvl: number) => {
      switch (lvl) {
          case 0: return '#002147'; // Granatowy (Główny)
          case 1: return '#C5A059'; // Złoty (Struktura)
          case 2: return '#4B5563'; // Szary (Manager)
          default: return '#0078D4'; // Niebieski (Doradca)
      }
  };

  const roleColor = getRoleColor(absoluteLevel);

  // --- LOGIKA ETYKIETOWANIA ---
  const getLabel = () => {
      if (absoluteLevel === 0) return 'DYREKTOR STRUKTURY';
      if (absoluteLevel === 1) return 'DYREKTOR MANAGER';
      if (hasChildren) return 'MANAGER DORADCA';
      return 'DORADCA BIZNESOWY';
  };

  const currentLabel = getLabel();

  // --- LOGIKA STYLÓW ---
  const getCardStyle = (label: string) => {
    switch (label) {
        case 'DYREKTOR STRUKTURY':
            return 'bg-[#002147] text-white shadow-2xl scale-105'; 
        case 'DYREKTOR MANAGER':
            return 'bg-white text-[#002147] shadow-lg';
        case 'MANAGER DORADCA':
            return 'bg-white text-[#374151] shadow-md';
        case 'DORADCA BIZNESOWY':
        default:
            return 'bg-white text-[#605E5C] shadow-sm';
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('userId', node.user.id);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation(); 
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault(); 
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const draggedUserId = e.dataTransfer.getData('userId');
    if (draggedUserId === node.user.id) return;
    onMoveUser(draggedUserId, node.user.email);
  };

  return (
    <div className={`flex flex-col items-center ${isHighlighted ? 'z-50' : 'z-10'}`}>
      {/* KARTA UŻYTKOWNIKA */}
      <div 
        ref={nodeRef}
        className={`
          relative flex flex-col items-center justify-center
          transition-all duration-500 rounded-md cursor-pointer
          ${isDragOver && !readOnly ? 'scale-110 ring-4 ring-[#C5A059] shadow-2xl' : 'hover:scale-105 hover:shadow-lg'}
          ${isHighlighted ? 'ring-4 ring-red-500 scale-110 shadow-[0_0_30px_rgba(220,38,38,0.5)] bg-yellow-50' : 'shadow-md'} 
          ${showDetails ? 'w-80 p-5 min-h-[160px]' : 'w-48 py-3 px-3 min-h-[70px]'}
          ${getCardStyle(currentLabel)}
        `}
        // SYSTEM KOLORÓW:
        // 1. Górny border: Rola (Ranga)
        // 2. Cień/Ring: Gałąź (Zespół) - subtelny akcent
        style={{ 
            borderTop: `6px solid ${roleColor}`,
            boxShadow: showDetails ? `0 20px 25px -5px ${branchColor}40` : undefined
        }}
        onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
        }}
        draggable={!readOnly}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Kropka gałęzi (aby widzieć przynależność w karcie) */}
        {!showDetails && absoluteLevel > 0 && (
            <div 
                className="absolute top-2 right-2 w-2 h-2 rounded-full" 
                style={{ backgroundColor: branchColor }} 
                title={`Zespół: ${node.user.hierarchicalId.split('/')[1] || 'Main'}`}
            ></div>
        )}

        {!readOnly && (
            <button 
                className="absolute -top-3 right-2 bg-[#002147] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-[#C5A059] transition-colors z-20 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(node.user);
                }}
                title="Dodaj podwładnego"
            >
                +
            </button>
        )}

        {!showDetails && (
            <div className="flex flex-col items-start w-full pl-1">
                <span 
                    className="text-[8px] font-black uppercase tracking-widest mb-1"
                    style={{ color: roleColor === '#002147' ? '#C5A059' : roleColor }} 
                >
                    {currentLabel}
                </span>
                <div className="text-xs font-bold leading-tight break-all text-left">
                    {node.user.firstName} {node.user.lastName}
                </div>
                <div className="mt-1.5 flex items-center justify-between w-full">
                    <span className="opacity-70 text-[9px] font-mono bg-black/5 px-1.5 py-0.5 rounded border border-black/5">
                        {node.user.hierarchicalId}
                    </span>
                    {hasChildren && (
                        <span 
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                            // Licznik w kolorze ROLI
                            style={{ backgroundColor: roleColor }}
                        >
                            {node.children.length}
                        </span>
                    )}
                </div>
            </div>
        )}

        {showDetails && (
            <div className="flex flex-col items-center w-full animate-in zoom-in duration-200 relative">
                <div className="text-[10px] uppercase font-bold tracking-widest mb-3" style={{ color: roleColor }}>
                    {node.user.role} | {currentLabel}
                </div>
                <div className="text-lg font-black text-center leading-tight mb-1">
                    {node.user.firstName} {node.user.lastName}
                </div>
                
                {/* Wskaźnik zespołu w szczegółach */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branchColor }}></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Gałąź: {node.user.hierarchicalId.split('/')[1] || 'Centrala'}
                    </span>
                </div>

                <div className="text-[11px] font-mono font-bold mb-3 bg-black/5 px-3 py-1 rounded w-full text-center border border-black/5">
                    {node.user.hierarchicalId}
                </div>
                <div className="text-[10px] break-all text-center opacity-80 mb-4 bg-gray-50 px-2 py-1.5 rounded w-full border border-gray-200 text-gray-600 font-medium">
                    {node.user.email}
                </div>
                
                {!readOnly && (
                    <div className="flex flex-col gap-2 w-full mt-2 border-t border-black/10 pt-3">
                        <button 
                            className={`text-[9px] py-2 px-2 rounded font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 w-full shadow-sm
                                ${absoluteLevel === 0 ? 'bg-[#C5A059] text-[#002147] hover:bg-white' : 'bg-[#002147] text-white hover:bg-[#003366]'}
                            `}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditUser(node.user);
                            }}
                        >
                            <ICONS.Edit /> Zmień Przełożonego
                        </button>

                        <button 
                            className="text-[9px] py-2 px-2 rounded font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddChild(node.user);
                            }}
                        >
                            + Dodaj Podwładnego
                        </button>
                    </div>
                )}

                {hasChildren && (
                    <button 
                        className="text-[9px] mt-2 underline opacity-60 hover:opacity-100 uppercase font-bold"
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                    >
                        {expanded ? 'Zwiń strukturę' : `Pokaż strukturę (${node.children.length})`}
                    </button>
                )}
            </div>
        )}
        
        {hasChildren && !expanded && (
            <div 
                className="absolute -bottom-3 flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shadow-md border-2 border-white text-white"
                style={{ backgroundColor: roleColor }}
            >
                {node.children.length}
            </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-1 duration-300">
          {/* Linia od rodzica w dół - KOLOR GAŁĘZI */}
          <div className="w-px h-6" style={{ backgroundColor: `${branchColor}80` }}></div>
          
          <div className="flex items-start justify-center">
            {node.children.map((child, index) => (
              <div key={child.user.id} className="flex flex-col items-center px-2">
                <div className="flex items-center w-full">
                   {/* Poziome linie - KOLOR GAŁĘZI */}
                   <div className={`h-px w-1/2 ${index === 0 ? 'invisible' : ''}`} style={{ backgroundColor: `${branchColor}80` }}></div>
                   <div className={`h-px w-1/2 ${index === node.children.length - 1 ? 'invisible' : ''}`} style={{ backgroundColor: `${branchColor}80` }}></div>
                </div>
                {/* Pionowa linia do dziecka - KOLOR GAŁĘZI */}
                <div className="w-px h-4" style={{ backgroundColor: `${branchColor}80` }}></div>
                
                <OrgChartNode 
                    node={child} 
                    depth={depth + 1} 
                    onMoveUser={onMoveUser} 
                    onEditUser={onEditUser}
                    onAddChild={onAddChild}
                    globalExpandState={globalExpandState}
                    highlightedUserId={highlightedUserId} 
                    readOnly={readOnly}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
