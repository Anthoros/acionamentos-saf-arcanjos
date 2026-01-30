
import React from 'react';

interface HeaderProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeFilter, onFilterChange }) => {
  const timeFilters = ['Hoje', 'Últimos 7 Dias', 'Este Mês', 'Trimestral', 'Anual'];

  return (
    <header className="flex flex-col md:flex-row items-center justify-between border-b border-solid border-slate-800 px-8 py-4 bg-background-dark sticky top-0 z-50 gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg text-white">
          <span className="material-symbols-outlined text-2xl">monitoring</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase">
          Controle de Acionamentos SAF Arcanjos
        </h2>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Time Selector - Only selector remaining here to avoid redundancy */}
        <div className="relative group">
          <button className="flex items-center gap-2 bg-accent-cyan hover:opacity-90 text-slate-900 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-accent-cyan/10">
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            <span className="text-sm font-bold hidden sm:inline">{activeFilter}</span>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute right-0 mt-2 w-48 bg-surface-dark border border-slate-700 rounded-lg shadow-xl z-[60] overflow-hidden transition-all duration-200">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`block w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-slate-700/50 last:border-0 ${
                  activeFilter === filter ? 'bg-accent-cyan text-slate-900 font-bold' : 'text-slate-200 hover:bg-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
