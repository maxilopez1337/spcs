
import React, { useState, useEffect } from 'react';
import { useResults } from '../../../hooks/useResults';
import { StatsCard } from './StatsCard';
import { RecentActivityTable } from './RecentActivityTable';
import { ActivityLogs } from './ActivityLogs';
import { ICONS } from '../../../constants';
import { LogModule } from '../../../types';
import { Skeleton } from '../../ui/Skeleton';

interface DashboardTabProps {
    onNavigateToResults: () => void;
    onNavigateToModule: (module: LogModule) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigateToResults, onNavigateToModule }) => {
  const { results, getStats } = useResults();
  const [isLoading, setIsLoading] = useState(true);
  const stats = getStats();

  // Symulacja ładowania danych dla efektu UX
  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
      return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="dynamics-card p-5 border-l-4 border-gray-200 bg-white">
                        <Skeleton variant="text" width="60%" className="mb-4" />
                        <Skeleton variant="rectangular" height={40} width="40%" className="mb-2" />
                        <Skeleton variant="text" width="80%" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Skeleton */}
                <div className="col-span-1 dynamics-card p-6 bg-white border-t-4 border-gray-200 h-[300px] flex flex-col justify-center gap-4">
                    <Skeleton variant="text" width="50%" className="mb-4" />
                    <Skeleton variant="rectangular" height={20} width="100%" />
                    <Skeleton variant="rectangular" height={20} width="100%" />
                    <Skeleton variant="rectangular" height={20} width="100%" />
                </div>
                {/* Table Skeleton */}
                <div className="col-span-1 lg:col-span-2 dynamics-card p-0 bg-white border-t-4 border-gray-200 h-[300px]">
                    <div className="p-5 border-b border-gray-100 flex justify-between">
                        <Skeleton variant="text" width="150px" />
                        <Skeleton variant="text" width="100px" />
                    </div>
                    <div className="p-5 space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton variant="text" width="20%" />
                                <Skeleton variant="text" width="40%" />
                                <Skeleton variant="text" width="20%" />
                                <Skeleton variant="text" width="20%" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard label="Liczba Egzaminów" value={stats.totalExams} description="Łącznie przeprowadzonych" icon={<ICONS.Clock />} />
        <StatsCard 
          label="Zdanych" 
          value={stats.passed} 
          description="Wynik pozytywny" 
          icon={<ICONS.Check />} 
          variant="success"
        />
        <StatsCard 
          label="Niezdanych" 
          value={stats.failed} 
          description="Wynik negatywny" 
          icon={<ICONS.Alert />} 
          variant="danger"
        />
        <StatsCard label="Zdawalność" value={`${stats.passRate}%`} description="Skuteczność szkoleń" variant="highlight" />
        <StatsCard label="Baza Kadrowa" value={stats.userCount} description="Zarejestrowani użytkownicy" icon={<ICONS.User />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* 2. Visual Breakdown Chart */}
         <div className="col-span-1 dynamics-card p-6 border-t-4 border-[#002147] flex flex-col justify-center bg-white min-h-[300px]">
            <h3 className="text-sm font-bold uppercase text-[#002147] mb-6">Efektywność Certyfikacji</h3>
            
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-[#002147]">ZALICZONE</span>
                        <span className="text-[#002147]">{stats.passed}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#002147] h-full" style={{width: `${stats.passRate}%`}}></div>
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-[#605E5C]">NIEZALICZONE</span>
                        <span className="text-[#605E5C]">{stats.failed}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#605E5C] h-full" style={{width: `${100 - stats.passRate}%`}}></div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center">Dane aktualizowane w czasie rzeczywistym</p>
            </div>
         </div>

         {/* 3. Recent Activity (Exams) */}
         <RecentActivityTable results={results} onViewAll={onNavigateToResults} />
      </div>

      {/* 4. SYSTEM AUTO LOGS (AUDIT TRAIL) */}
      <div className="grid grid-cols-1">
          <ActivityLogs onNavigate={onNavigateToModule} />
      </div>
    </div>
  );
};
