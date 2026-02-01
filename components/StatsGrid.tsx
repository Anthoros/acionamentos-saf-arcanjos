
import React from 'react';
import { DashboardStats } from '../types';

interface StatsGridProps {
  stats: DashboardStats;
  selectedBrand: string;
  onBrandClick: (brandKey: string) => void;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats, selectedBrand, onBrandClick }) => {
  const brands = [
    { name: 'Grupo Trigo', key: 'grupo trigo', color: 'text-white', isTotal: true },
    { name: 'Spoleto', key: 'spoleto', color: 'text-brand-spoleto' },
    { name: 'China in Box', key: 'china in box', color: 'text-brand-china' },
    { name: 'Gendai', key: 'gendai', color: 'text-brand-gendai' },
    { name: 'Koni', key: 'koni', color: 'text-brand-koni' },
    { name: 'Asa', key: 'asa', color: 'text-brand-asa' },
  ];

  const getBrandCount = (brandSearch: string) => {
    const total = (Object.entries(stats.brandCounts) as [string, number][]).reduce((acc, [key, count]) => {
      if (key.toLowerCase().includes(brandSearch.toLowerCase())) {
        return acc + count;
      }
      return acc;
    }, 0);
    return total;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 mb-8">
      {brands.map((brand) => {
        const isActive = selectedBrand.toLowerCase() === brand.key.toLowerCase();
        const count = brand.isTotal ? stats.totalTickets : getBrandCount(brand.key);
        const percentage = stats.totalTickets > 0 
          ? ((count / stats.totalTickets) * 100).toFixed(1) 
          : '0.0';

        const activeStores = stats.uniqueStoreCounts[brand.key.toLowerCase()] || 0;
        const totalPossibleStores = stats.totalStoresMap[brand.key.toLowerCase()] || 1;
        
        // 1. Índice de Abrangência (% de lojas da rede com problema) - Trava em 100%
        const rawAbrangencia = (activeStores / totalPossibleStores) * 100;
        const abrangencia = Math.min(rawAbrangencia, 100).toFixed(1);
        
        // 2. Índice de Reincidência (Média de chamados por loja ativa)
        const reincidencia = activeStores > 0 ? (count / activeStores).toFixed(1) : '0.0';
        
        return (
          <button 
            key={brand.key} 
            onClick={() => onBrandClick(brand.key)}
            className={`p-6 rounded-xl border transition-all duration-300 text-left flex flex-col justify-between group h-36 relative overflow-hidden
              ${isActive 
                ? brand.isTotal 
                  ? 'bg-primary border-white ring-4 ring-primary/30 scale-105 z-10 shadow-2xl shadow-primary/40' 
                  : 'bg-surface-dark border-primary ring-4 ring-primary/20 scale-105 z-10 shadow-2xl shadow-primary/20'
                : 'bg-surface-dark border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
              }`}
          >
            {/* Background decoration */}
            <div className={`absolute -right-4 -bottom-4 size-16 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 ${isActive ? 'opacity-10' : ''}`}>
               <span className="material-symbols-outlined text-6xl">analytics</span>
            </div>

            <div className="flex items-center justify-between w-full relative z-10">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : brand.color}`}>
                {brand.name}
              </p>
              {!brand.isTotal && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-900/50 text-slate-400 border border-slate-800'}`}>
                  {percentage}%
                </span>
              )}
            </div>
            
            <div className="flex items-end justify-between mt-auto relative z-10">
              <div className="flex flex-col">
                <h3 className={`text-3xl font-bold leading-none ${isActive ? 'text-white' : 'text-slate-100'}`}>
                  {count.toLocaleString()}
                </h3>
                <div className="flex gap-2 mt-2">
                  <div className="flex flex-col" title="Abrangência: % da rede que chamou">
                    <span className={`text-[8px] font-black uppercase ${isActive ? 'text-white/60' : 'text-slate-500'}`}>Abrang.</span>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-accent-cyan'}`}>{abrangencia}%</span>
                  </div>
                  <div className="flex flex-col" title="Reincidência: Média de chamados por loja">
                    <span className={`text-[8px] font-black uppercase ${isActive ? 'text-white/60' : 'text-slate-500'}`}>Reincid.</span>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-primary'}`}>{reincidencia}x</span>
                  </div>
                </div>
              </div>
              {!brand.isTotal && (
                <span className={`material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white' : brand.color}`}>
                  branding_watermark
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StatsGrid;
