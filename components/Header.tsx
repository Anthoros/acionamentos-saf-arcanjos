
import React, { useState, useMemo, useEffect, useRef } from 'react';

interface HeaderProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  allStores: string[];
  onStoreSelect: (store: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeFilter, onFilterChange, allStores, onStoreSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const timeFilters = [
    { label: 'Últimos 7 dias', value: '7d' },
    { label: 'Últimos 30 dias', value: '30d' },
    { label: 'Últimos 90 dias', value: '90d' },
    { label: 'Últimos 12 meses', value: '12m' },
    { divider: true },
    { label: 'Hoje', value: 'hoje' },
    { label: 'Ontem', value: 'ontem' },
    { label: 'Esta semana', value: 'semana_atual' },
    { label: 'Este mês', value: 'mes_atual' },
    { label: 'Este ano', value: 'ano_atual' },
    { divider: true },
    { label: 'Mês anterior', value: 'mes_anterior' },
    { label: 'Ano anterior', value: 'ano_anterior' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStores = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return allStores
      .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 8);
  }, [searchTerm, allStores]);

  return (
    <header className="flex flex-col md:flex-row items-center justify-between border-b border-solid border-slate-800 px-8 py-4 bg-background-dark sticky top-0 z-50 gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <img 
          src="https://api-zendesk-arcanjos.replit.app/assets/LOGOARC_1749750824381-DFtw5VI2.png" 
          alt="Logo Arcanjos" 
          className="h-10 w-auto object-contain"
        />
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase">
          Controle de Acionamentos SAF Arcanjos
        </h2>
      </div>
      
      <div className="flex items-center gap-4 flex-1 justify-end w-full md:w-auto">
        {/* Unit Search Autocomplete */}
        <div className="relative flex-1 max-w-xs" ref={searchRef}>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input 
              type="text"
              placeholder="Pesquisar unidade..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => { 
                setSearchTerm(e.target.value); 
                setShowResults(true); 
              }}
              onFocus={() => setShowResults(true)}
            />
          </div>
          
          {showResults && filteredStores.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-surface-dark border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {filteredStores.map(store => (
                <button
                  key={store}
                  className="w-full text-left px-4 py-3 text-xs hover:bg-primary/10 hover:text-primary transition-colors border-b border-slate-800 last:border-0 text-slate-300 font-medium"
                  onClick={() => {
                    onStoreSelect(store);
                    setSearchTerm('');
                    setShowResults(false);
                  }}
                >
                  {store}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Selector */}
        <div className="relative group shrink-0">
          <button className="flex items-center gap-2 bg-accent-cyan hover:opacity-90 text-slate-900 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-accent-cyan/10">
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            <span className="text-sm font-bold hidden sm:inline">{activeFilter}</span>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute right-0 mt-2 w-56 bg-surface-dark border border-slate-700 rounded-lg shadow-xl z-[60] overflow-hidden transition-all duration-200">
            <div className="max-h-[70vh] overflow-y-auto">
              {timeFilters.map((f, i) => f.divider ? (
                <div key={i} className="border-t border-slate-700/50 my-1" />
              ) : (
                <button
                  key={f.value}
                  onClick={() => onFilterChange(f.label)}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    activeFilter === f.label ? 'bg-accent-cyan text-slate-900 font-bold' : 'text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;