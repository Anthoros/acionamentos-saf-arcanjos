
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
    { name: 'China in Box', key: 'china', color: 'text-brand-china' },
    { name: 'Gendai', key: 'gendai', color: 'text-brand-gendai' },
    { name: 'Asa', key: 'asa', color: 'text-brand-asa' },
    { name: 'Koni', key: 'koni', color: 'text-brand-koni' },
  ];

  const getBrandCount = (brandSearch: string) => {
    const total = Object.entries(stats.brandCounts).reduce((acc, [key, count]) => {
      if (key.toLowerCase().includes(brandSearch.toLowerCase())) {
        return acc + count;
      }
      return acc;
    }, 0);
    return total;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {brands.map((brand) => {
        const isActive = selectedBrand.toLowerCase() === brand.key.toLowerCase();
        
        return (
          <button 
            key={brand.key} 
            onClick={() => onBrandClick(brand.key)}
            className={`p-6 rounded-xl border transition-all duration-300 text-left flex flex-col justify-between group h-32 relative overflow-hidden
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
              {isActive && (
                <span className="material-symbols-outlined text-sm text-white animate-pulse">check_circle</span>
              )}
            </div>
            
            <div className="flex items-end justify-between mt-auto relative z-10">
              <h3 className={`text-3xl font-bold ${isActive ? 'text-white' : 'text-slate-100'}`}>
                {brand.isTotal ? stats.totalTickets.toLocaleString() : getBrandCount(brand.key).toLocaleString()}
              </h3>
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
