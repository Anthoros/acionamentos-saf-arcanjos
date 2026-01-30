
import React from 'react';
import { DashboardStats } from '../types';

interface StatsGridProps {
  stats: DashboardStats;
  selectedBrand: string;
  onBrandClick: (brand: string) => void;
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

  const getBrandCount = (brandName: string) => {
    const key = Object.keys(stats.brandCounts).find(
      k => k.toLowerCase().includes(brandName.toLowerCase())
    );
    return key ? stats.brandCounts[key] : 0;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {brands.map((brand) => {
        const isActive = selectedBrand.toLowerCase() === brand.key;
        
        return (
          <button 
            key={brand.key} 
            onClick={() => onBrandClick(brand.name)}
            className={`p-6 rounded-xl border transition-all duration-300 text-left flex flex-col justify-between group h-32
              ${isActive 
                ? brand.isTotal 
                  ? 'bg-primary border-white ring-4 ring-primary/30 scale-105 z-10 shadow-2xl shadow-primary/40' 
                  : 'bg-surface-dark border-primary ring-4 ring-primary/20 scale-105 z-10 shadow-2xl shadow-primary/20'
                : 'bg-surface-dark border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
              }`}
          >
            <div className="flex items-center justify-between w-full">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : brand.color}`}>
                {brand.name}
              </p>
              {isActive && (
                <span className="material-symbols-outlined text-sm text-white animate-pulse">check_circle</span>
              )}
            </div>
            <div className="flex items-end justify-between mt-auto">
              <h3 className={`text-3xl font-bold ${isActive ? 'text-white' : 'text-slate-100'}`}>
                {brand.isTotal ? stats.totalTickets.toLocaleString() : getBrandCount(brand.name).toLocaleString()}
              </h3>
              {!brand.isTotal && (
                <span className={`material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity ${brand.color}`}>
                  branding_watermark
                </span>
              )}
              {brand.isTotal && (
                <span className="material-symbols-outlined opacity-40 text-white">analytics</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StatsGrid;
