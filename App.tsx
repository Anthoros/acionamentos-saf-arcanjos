
import React, { useState, useEffect, useMemo } from 'react';
import { fetchData, calculateStats, getLastUpdateInfo } from './services/dataService';
import { TicketData, DashboardStats } from './types';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import { 
  SystemDistribution, 
  TopReasons, 
  TopStores, 
  PeriodDistribution 
} from './components/Charts';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('Últimos 7 dias');
  const [selectedBrand, setSelectedBrand] = useState('grupo trigo'); // Store the key
  const [lastDataUpdate, setLastDataUpdate] = useState<string>('');
  const [drillDown, setDrillDown] = useState<{ type: string | null; value: string | null }>({
    type: null,
    value: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchData();
        if (data.length === 0) {
          setError("Nenhum dado encontrado na planilha.");
        } else {
          setRawData(data);
          // Calculate the timestamp of the last record in the sheet
          setLastDataUpdate(getLastUpdateInfo(data));
        }
      } catch (err) {
        setError("Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 300000); // 5 min auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Filter stage 1: Time filter only (The baseline for everything)
  const timeFilteredData = useMemo(() => {
    if (rawData.length === 0) return [];

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    return rawData.filter(item => {
      if (!item.data_abertura) return false;
      
      const parts = item.data_abertura.split(/[-/]/).map(Number);
      if (parts.length < 3) return false;
      
      const [dia, mes, ano] = parts;
      const dataTicket = new Date(ano, mes - 1, dia);

      let timePass = false;

      switch (activeFilter) {
        case 'Hoje':
          timePass = dataTicket.getTime() === hoje.getTime();
          break;
        case 'Ontem':
          const ontem = new Date(hoje);
          ontem.setDate(hoje.getDate() - 1);
          timePass = dataTicket.getTime() === ontem.getTime();
          break;
        case 'Últimos 7 dias':
          const seteDias = new Date(hoje);
          seteDias.setDate(hoje.getDate() - 7);
          timePass = dataTicket >= seteDias && dataTicket <= hoje;
          break;
        case 'Últimos 30 dias':
          const trintaDias = new Date(hoje);
          trintaDias.setDate(hoje.getDate() - 30);
          timePass = dataTicket >= trintaDias && dataTicket <= hoje;
          break;
        case 'Últimos 90 dias':
          const noventaDias = new Date(hoje);
          noventaDias.setDate(hoje.getDate() - 90);
          timePass = dataTicket >= noventaDias && dataTicket <= hoje;
          break;
        case 'Últimos 12 meses':
          const umAnoAtras = new Date(hoje);
          umAnoAtras.setFullYear(hoje.getFullYear() - 1);
          timePass = dataTicket >= umAnoAtras && dataTicket <= hoje;
          break;
        case 'Esta semana':
          // Finding first day of current week (Sunday)
          const primeiroDiaSemana = new Date(hoje);
          primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
          timePass = dataTicket >= primeiroDiaSemana && dataTicket <= hoje;
          break;
        case 'Este mês':
          timePass = dataTicket.getMonth() === hoje.getMonth() && 
                     dataTicket.getFullYear() === hoje.getFullYear();
          break;
        case 'Mês anterior':
          const mesAnterior = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
          const anoDoMesAnterior = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
          timePass = dataTicket.getMonth() === mesAnterior && 
                     dataTicket.getFullYear() === anoDoMesAnterior;
          break;
        case 'Este ano':
          timePass = dataTicket.getFullYear() === hoje.getFullYear();
          break;
        case 'Ano anterior':
          timePass = dataTicket.getFullYear() === hoje.getFullYear() - 1;
          break;
        default:
          timePass = true;
      }
      return timePass;
    });
  }, [rawData, activeFilter]);

  // Filter stage 2: Drilldown (Search/Unit/System)
  const drillDownFilteredData = useMemo(() => {
    let data = [...timeFilteredData];

    if (drillDown.type && drillDown.value) {
      const type = drillDown.type;
      const val = drillDown.value;
      data = data.filter(item => {
        if (type === 'sistema') {
          return (item.sistema?.toUpperCase() || '').includes(val.toUpperCase());
        }
        const key = type as keyof TicketData;
        return item[key] === val;
      });
    }

    return data;
  }, [timeFilteredData, drillDown]);

  // Filter stage 3: Brand selection
  const finalFilteredData = useMemo(() => {
    let data = [...drillDownFilteredData];

    if (selectedBrand !== 'grupo trigo') {
      data = data.filter(item => 
        (item.marca?.toLowerCase() || '').includes(selectedBrand.toLowerCase())
      );
    }

    return data;
  }, [drillDownFilteredData, selectedBrand]);

  const statsForGrid = useMemo(() => calculateStats(drillDownFilteredData), [drillDownFilteredData]);
  const statsForCharts = useMemo(() => calculateStats(finalFilteredData), [finalFilteredData]);

  const allUniqueStores = useMemo(() => {
    const stores = rawData.map(item => item.unidade).filter(Boolean);
    return Array.from(new Set(stores)).sort();
  }, [rawData]);

  const handleDrillDown = (type: string, value: string) => {
    if (drillDown.type === type && drillDown.value === value) {
      setDrillDown({ type: null, value: null });
    } else {
      setDrillDown({ type, value });
    }
  };

  const handleBrandClick = (brandKey: string) => {
    setSelectedBrand(brandKey);
  };

  const handleStoreSelect = (store: string) => {
    setDrillDown({ type: 'unidade', value: store });
  };

  const clearAllFilters = () => {
    setDrillDown({ type: null, value: null });
    setSelectedBrand('grupo trigo');
    setActiveFilter('Últimos 7 dias');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white p-8">
        <div className="size-20 border-4 border-slate-800 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-8 text-lg font-medium animate-pulse uppercase tracking-widest">Carregando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-slate-100 selection:bg-primary/30">
      <Header 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter}
        allStores={allUniqueStores}
        onStoreSelect={handleStoreSelect}
      />
      
      <main className="flex-1 p-4 md:p-8 max-w-[1440px] mx-auto w-full">
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
                <span className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded border border-primary/20 font-bold capitalize">
                  <span className="material-symbols-outlined text-xs">branding_watermark</span> {selectedBrand}
                </span>
              )}
              {drillDown.value && (
                <span className="flex items-center gap-1 bg-accent-cyan/20 text-accent-cyan px-2 py-1 rounded border border-accent-cyan/20 font-bold">
                  <span className="material-symbols-outlined text-xs">filter_list</span> {drillDown.value}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {(drillDown.value || selectedBrand !== 'grupo trigo' || activeFilter !== 'Últimos 7 dias') && (
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

        {statsForCharts.totalTickets === 0 ? (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <SystemDistribution 
                stats={statsForCharts} 
                tickets={finalFilteredData}
                onDrillDown={handleDrillDown} 
                activeDrill={drillDown}
              />
              <TopReasons 
                stats={statsForCharts} 
                tickets={finalFilteredData}
                onDrillDown={handleDrillDown} 
                activeDrill={drillDown}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TopStores 
                stats={statsForCharts} 
                tickets={finalFilteredData}
                onDrillDown={handleDrillDown} 
                activeDrill={drillDown}
              />
              <PeriodDistribution 
                stats={statsForCharts} 
                tickets={finalFilteredData}
                onDrillDown={handleDrillDown} 
                activeDrill={drillDown}
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
