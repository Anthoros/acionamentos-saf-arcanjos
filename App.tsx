
import React, { useState, useEffect, useMemo } from 'react';
import { fetchData, calculateStats, getLastUpdateInfo } from './services/dataService.ts';
import { TicketData, DashboardStats } from './types.ts';
import Header from './components/Header.tsx';
import StatsGrid from './components/StatsGrid.tsx';
import { 
  SystemDistribution, 
  TopReasons, 
  TopStores, 
  PeriodDistribution 
} from './components/Charts.tsx';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('Últimos 7 dias');
  const [selectedBrand, setSelectedBrand] = useState('grupo trigo');
  const [lastDataUpdate, setLastDataUpdate] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // 1. Initialize filters from URL on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      
      const brandParam = params.get('marca');
      if (brandParam) setSelectedBrand(brandParam.toLowerCase());
      
      const periodParam = params.get('periodo');
      if (periodParam) setActiveFilter(periodParam);
      
      const newActiveFilters: Record<string, string> = {};
      const loja = params.get('loja');
      const motivo = params.get('motivo');
      const sistema = params.get('sistema');
      const turno = params.get('turno');
      
      if (loja) newActiveFilters.unidade = loja;
      if (motivo) newActiveFilters.categoria = motivo;
      if (sistema) newActiveFilters.sistema = sistema;
      if (turno) newActiveFilters.turno = turno;
      
      if (Object.keys(newActiveFilters).length > 0) {
        setActiveFilters(newActiveFilters);
      }
    } catch (e) {
      console.error("Failed to parse URL parameters", e);
    }
  }, []);

  // 2. Load data from spreadsheet
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchData();
        if (!data || data.length === 0) {
          setError("Nenhum dado encontrado ou erro de conexão.");
        } else {
          setRawData(data);
          setLastDataUpdate(getLastUpdateInfo(data));
          setError(null);
        }
      } catch (err) {
        console.error("Data load error", err);
        setError("Erro ao carregar os dados. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 300000); // 5 min auto-refresh
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (!rawData || rawData.length === 0) return { gridData: [], finalData: [] };

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    const timeData = rawData.filter(item => {
      if (!item || !item.data_abertura) return false;
      const parts = item.data_abertura.split(/[-/]/).map(Number);
      if (parts.length < 3) return false;
      const [dia, mes, ano] = parts;
      const dataTicket = new Date(ano, mes - 1, dia);

      switch (activeFilter) {
        case 'Hoje': return dataTicket.getTime() === hoje.getTime();
        case 'Ontem': {
          const ontem = new Date(hoje);
          ontem.setDate(hoje.getDate() - 1);
          return dataTicket.getTime() === ontem.getTime();
        }
        case 'Últimos 7 dias': {
          const seteDias = new Date(hoje);
          seteDias.setDate(hoje.getDate() - 7);
          return dataTicket >= seteDias && dataTicket <= hoje;
        }
        case 'Últimos 30 dias': {
          const trintaDias = new Date(hoje);
          trintaDias.setDate(hoje.getDate() - 30);
          return dataTicket >= trintaDias && dataTicket <= hoje;
        }
        case 'Últimos 90 dias': {
          const noventaDias = new Date(hoje);
          noventaDias.setDate(hoje.getDate() - 90);
          return dataTicket >= noventaDias && dataTicket <= hoje;
        }
        case 'Últimos 12 meses': {
          const umAnoAtras = new Date(hoje);
          umAnoAtras.setFullYear(hoje.getFullYear() - 1);
          return dataTicket >= umAnoAtras && dataTicket <= hoje;
        }
        case 'Esta semana': {
          const primeiroDiaSemana = new Date(hoje);
          primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
          return dataTicket >= primeiroDiaSemana && dataTicket <= hoje;
        }
        case 'Este mês': return dataTicket.getMonth() === hoje.getMonth() && dataTicket.getFullYear() === hoje.getFullYear();
        case 'Mês anterior': {
          const mesAnterior = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
          const anoDoMesAnterior = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
          return dataTicket.getMonth() === mesAnterior && dataTicket.getFullYear() === anoDoMesAnterior;
        }
        case 'Este ano': return dataTicket.getFullYear() === hoje.getFullYear();
        case 'Ano anterior': return dataTicket.getFullYear() === hoje.getFullYear() - 1;
        default: return true;
      }
    });

    const gridData = timeData.filter(item => {
      return Object.entries(activeFilters).every(([type, value]) => {
        if (type === 'categoria') return true; 
        const key = type as keyof TicketData;
        const valStr = String(value);
        if (type === 'sistema') return (item.sistema?.toUpperCase() || '').includes(valStr.toUpperCase());
        return item[key] === value;
      });
    });

    const finalData = gridData.filter(item => {
      if (selectedBrand && selectedBrand !== 'grupo trigo') {
        if (!(item.marca?.toLowerCase() || '').includes(selectedBrand.toLowerCase())) return false;
      }
      if (activeFilters.categoria) {
        if (item.categoria !== activeFilters.categoria) return false;
      }
      return true;
    });

    return { gridData, finalData };
  }, [rawData, activeFilter, selectedBrand, activeFilters]);

  const statsForGrid = useMemo(() => calculateStats(filteredData.gridData), [filteredData.gridData]);
  const statsForCharts = useMemo(() => calculateStats(filteredData.finalData), [filteredData.finalData]);

  const allUniqueStores = useMemo(() => {
    if (!rawData) return [];
    const stores = rawData.map(item => item.unidade).filter(Boolean);
    return Array.from(new Set(stores)).sort();
  }, [rawData]);

  const handleDrillDown = (type: string, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[type] === value) {
        delete newFilters[type];
        
        // CASCADING RULE: If we remove 'sistema', we also clear 'categoria'
        if (type === 'sistema') {
          delete newFilters['categoria'];
        }
      } else {
        newFilters[type] = value;
      }
      return newFilters;
    });
  };

  const handleBrandClick = (brandKey: string) => {
    setSelectedBrand(brandKey.toLowerCase());
  };

  const handleStoreSelect = (store: string) => {
    handleDrillDown('unidade', store);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSelectedBrand('grupo trigo');
    setActiveFilter('Últimos 7 dias');
  };

  const removeFilter = (key: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[key];
      // Cascading clear for system -> category here too
      if (key === 'sistema') {
        delete next['categoria'];
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white p-8">
        <div className="size-20 border-4 border-slate-800 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-8 text-lg font-medium animate-pulse uppercase tracking-widest">Carregando Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white p-8 text-center">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
        <h2 className="text-2xl font-bold mb-2">{error}</h2>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 bg-primary px-6 py-2 rounded-lg font-bold hover:bg-primary/80 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-slate-100 selection:bg-primary/30">
      <Header 
        activeFilter={activeFilter} 
        selectedBrand={selectedBrand}
        activeFilters={activeFilters}
        onFilterChange={setActiveFilter}
        allStores={allUniqueStores}
        onStoreSelect={handleStoreSelect}
      />
      
      <main className="flex-1 p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto w-full transition-all duration-500">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="size-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/20"></span>
              Visão Geral de Operações
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-text mt-2">
              <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                <span className="material-symbols-outlined text-xs">calendar_today</span> {activeFilter}
              </span>
              {selectedBrand !== 'grupo trigo' && (
                <button 
                  onClick={() => setSelectedBrand('grupo trigo')}
                  className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded border border-primary/20 font-bold capitalize hover:bg-primary/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">branding_watermark</span> {selectedBrand}
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
              {Object.entries(activeFilters).map(([key, value]) => (
                <button 
                  key={key}
                  onClick={() => removeFilter(key)}
                  className="flex items-center gap-1 bg-accent-cyan/20 text-accent-cyan px-2 py-1 rounded border border-accent-cyan/20 font-bold hover:bg-accent-cyan/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">
                    {key === 'unidade' ? 'store' : key === 'sistema' ? 'computer' : 'filter_list'}
                  </span> 
                  {value}
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {(Object.keys(activeFilters).length > 0 || selectedBrand !== 'grupo trigo' || activeFilter !== 'Últimos 7 dias') && (
              <button 
                onClick={clearAllFilters}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-all uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                Limpar Filtros
              </button>
            )}
            <div className="text-right hidden sm:block border-l border-slate-800 pl-4">
              <p className="text-[10px] text-secondary-text uppercase tracking-widest font-black">Último dado na planilha</p>
              <p className="text-sm font-bold text-accent-cyan">{lastDataUpdate || 'Carregando...'}</p>
            </div>
          </div>
        </div>

        <StatsGrid 
          stats={statsForGrid} 
          selectedBrand={selectedBrand} 
          onBrandClick={handleBrandClick}
        />

        {statsForGrid.totalTickets === 0 ? (
          <div className="bg-surface-dark p-20 rounded-2xl border border-dashed border-slate-800 text-center my-8">
            <div className="size-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="material-symbols-outlined text-slate-500 text-4xl">inventory_2</span>
            </div>
            <h3 className="text-xl font-bold text-slate-400">Nenhum acionamento encontrado</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">Tente ajustar o filtro de tempo ou selecionar outra marca para visualizar os dados.</p>
            <button 
              onClick={clearAllFilters}
              className="text-primary hover:text-accent-cyan mt-6 text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
            >
              Resetar todos os filtros <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-8">
              <SystemDistribution 
                stats={statsForCharts} 
                tickets={filteredData.finalData}
                onDrillDown={handleDrillDown} 
                activeFilters={activeFilters}
              />
              <TopReasons 
                stats={statsForCharts} 
                tickets={filteredData.finalData}
                onDrillDown={handleDrillDown} 
                activeFilters={activeFilters}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              <TopStores 
                stats={statsForCharts} 
                tickets={filteredData.finalData}
                onDrillDown={handleDrillDown} 
                activeFilters={activeFilters}
              />
              <PeriodDistribution 
                stats={statsForCharts} 
                tickets={filteredData.finalData}
                onDrillDown={handleDrillDown} 
                activeFilters={activeFilters}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] border-t border-slate-800 mt-12">
        &copy; {new Date().getFullYear()} SAF Arcanjos &bull; Inteligência de Negócios &bull; v2.1
      </footer>
    </div>
  );
};

export default App;
