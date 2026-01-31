
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardStats, TicketData } from '../types';

interface ChartProps {
  stats: DashboardStats;
  tickets: TicketData[];
  onDrillDown: (type: string, value: string) => void;
  activeFilters: Record<string, string>;
}

export const SYSTEM_COLORS: Record<string, string> = {
  'GCOM': '#3b82f6',
  'VIDEOSOFT': '#22d3ee',
  'TRIGO': '#f7ba47',
  'ALPHACODE': '#9B59B6',
  'BRASPAG': '#2ECC71',
  'CARDÁPIO': '#E74C3C',
  'DELIVERY': '#A2D149',
  'FIDELIDADE': '#FF33CC',
  'INFRAESTRUTURA': '#64748b',
  'MYORDERS': '#6C5CE7',
  'OUTROS': '#475569'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl ring-1 ring-white/10">
        <p className="text-white text-xs font-bold">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
  if (index > 3) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central" 
      className="text-[11px] font-black pointer-events-none drop-shadow-md"
    >
      {value}
    </text>
  );
};

export const SystemDistribution: React.FC<ChartProps> = ({ stats, onDrillDown, activeFilters }) => {
  const data = (Object.entries(stats.systemCounts) as [string, number][])
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[550px]">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
        <span className="material-symbols-outlined text-primary">donut_large</span>
        Distribuição por Sistema
        {activeFilters.sistema && (
          <span className="ml-auto text-[10px] bg-primary/20 text-primary px-2 py-1 rounded">Filtro: {activeFilters.sistema}</span>
        )}
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={85}
              outerRadius={135}
              paddingAngle={4}
              dataKey="value"
              onClick={(entry) => onDrillDown('sistema', entry.name)}
              className="cursor-pointer outline-none"
              label={renderCustomLabel}
              labelLine={false}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={SYSTEM_COLORS[entry.name] || '#475569'}
                  strokeWidth={activeFilters.sistema === entry.name ? 4 : 0}
                  stroke="#fff"
                  opacity={activeFilters.sistema && activeFilters.sistema !== entry.name ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }} 
              onClick={(e) => onDrillDown('sistema', e.value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4">
        <p className="text-3xl font-bold text-white tracking-tighter">{total}</p>
        <p className="text-[10px] text-secondary-text uppercase font-black tracking-[0.2em]">Total Acionamentos</p>
      </div>
    </div>
  );
};

export const TopReasons: React.FC<ChartProps> = ({ stats, onDrillDown, activeFilters }) => {
  const isDetailMode = !!activeFilters.categoria;
  const dataSource = isDetailMode ? stats.detailCounts : stats.reasonCounts;

  const sortedReasons = (Object.entries(dataSource) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxVal = Math.max(...sortedReasons.map(r => r[1]), 1);

  return (
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm h-[550px] flex flex-col transition-all duration-300">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white overflow-hidden">
        <span className="material-symbols-outlined text-primary shrink-0 transition-transform duration-300">
          {isDetailMode ? 'manage_search' : 'bar_chart'}
        </span>
        <span className="truncate">
          {isDetailMode ? `Detalhes: ${activeFilters.categoria}` : 'Principais Motivos'}
        </span>
        {isDetailMode && (
          <button 
            onClick={() => onDrillDown('categoria', activeFilters.categoria)}
            className="ml-auto text-[10px] bg-slate-700 hover:bg-primary text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shrink-0 font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-black/20"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            VOLTAR
          </button>
        )}
      </h3>
      <div className="flex-1 flex flex-col justify-between pb-2 gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto custom-scrollbar">
        {sortedReasons.map(([name, count], idx) => (
          <button 
            key={idx} 
            onClick={() => !isDetailMode && onDrillDown('categoria', name)}
            className={`relative w-full text-left group transition-all p-1.5 rounded-lg ${isDetailMode ? 'cursor-default' : 'cursor-pointer hover:bg-slate-800/40'}`}
            disabled={isDetailMode}
          >
            <div className="flex justify-between text-[10px] mb-1 uppercase font-black tracking-tight">
              <span className={`truncate pr-4 max-w-[85%] transition-colors ${activeFilters.categoria === name && !isDetailMode ? 'text-accent-cyan' : 'text-slate-400 group-hover:text-slate-100'}`}>
                {name}
                {!isDetailMode && stats.categorySystems[name] && (
                  <span className="ml-1 opacity-90 italic font-normal text-[9px]">
                    (
                    {stats.categorySystems[name].map((sys, i) => (
                      <span 
                        key={sys} 
                        style={{ color: SYSTEM_COLORS[sys] || '#94a3b8' }}
                      >
                        {sys}{i < stats.categorySystems[name].length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    )
                  </span>
                )}
              </span>
              <span className="text-white shrink-0 font-display">{count}</span>
            </div>
            <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden border border-slate-800/50">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.3)] ${isDetailMode ? 'bg-accent-cyan' : 'bg-primary'}`} 
                style={{ width: `${(count / maxVal) * 100}%` }}
              ></div>
            </div>
          </button>
        ))}
        {sortedReasons.length === 0 && isDetailMode && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-sm py-10">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-10">inventory_2</span>
            Sem detalhamento disponível para esta categoria
          </div>
        )}
      </div>
    </div>
  );
};

export const TopStores: React.FC<ChartProps> = ({ stats, tickets, onDrillDown, activeFilters }) => {
  const isStoreMode = !!activeFilters.unidade;

  const parseDateTime = (d: string, t?: string) => {
    const parts = d.split(/[-/]/);
    if (parts.length < 3) return new Date(0);
    const [dia, mes, ano] = parts;
    const isoDate = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    return new Date(`${isoDate}T${t || '00:00:00'}`);
  };

  const recentTickets = [...tickets].sort((a, b) => {
    const dateA = parseDateTime(a.data_abertura, a.hora_abertura);
    const dateB = parseDateTime(b.data_abertura, b.hora_abertura);
    return dateB.getTime() - dateA.getTime();
  }).slice(0, 10);

  const sortedStores = (Object.entries(stats.storeCounts) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm h-[550px] flex flex-col overflow-hidden">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
        <span className="material-symbols-outlined text-primary">
          {isStoreMode ? 'history' : 'store'}
        </span>
        <span className="truncate">
          {isStoreMode ? `Últimos Chamados: ${activeFilters.unidade}` : 'Unidades com maior volume'}
        </span>
        {isStoreMode && (
          <button 
            onClick={() => onDrillDown('unidade', activeFilters.unidade)}
            className="ml-auto text-[10px] bg-slate-700 hover:bg-primary text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shrink-0 font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-black/20"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            VOLTAR
          </button>
        )}
      </h3>
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
        {isStoreMode ? (
          recentTickets.length > 0 ? (
            recentTickets.map((t, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 flex flex-col gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-accent-cyan uppercase tracking-wider">
                    {t.data_abertura} {t.hora_abertura && `• ${t.hora_abertura}`}
                  </span>
                  <span 
                    className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 uppercase" 
                    style={{ color: SYSTEM_COLORS[t.sistema?.toUpperCase()] || '#94a3b8' }}
                  >
                    {t.sistema}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] font-bold text-slate-100 uppercase leading-tight">{t.categoria}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 italic leading-relaxed">
                    {t.detalhamento || 'Sem detalhamento adicional informado.'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-sm py-10">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-10">event_busy</span>
              Nenhum chamado recente encontrado
            </div>
          )
        ) : (
          sortedStores.map(([name, count], idx) => (
            <button 
              key={idx} 
              onClick={() => onDrillDown('unidade', name)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all group active:scale-[0.98] ${
                activeFilters.unidade === name ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-slate-800/40 border-slate-700/30 hover:bg-card-dark'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center size-6 rounded-full ${idx === 0 || activeFilters.unidade === name ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-700/50 text-slate-400'} font-black text-[10px]`}>
                  {idx + 1}
                </span>
                <p className={`text-[11px] font-bold uppercase truncate transition-colors ${activeFilters.unidade === name ? 'text-primary' : 'text-slate-200 group-hover:text-accent-cyan'}`}>{name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-white">{count}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export const PeriodDistribution: React.FC<ChartProps> = ({ stats, onDrillDown, activeFilters }) => {
  const periodColors: Record<string, string> = {
    'Manhã': '#38bdf8',
    'Tarde': '#f97316',
    'Noite': '#1e3a8a',
    'Madrugada': '#6366f1',
    'default': '#94a3b8'
  };

  const data = (Object.entries(stats.periodCounts) as [string, number][]).map(([name, value]) => ({
    name: name,
    value,
    color: periodColors[name] || periodColors.default
  })).sort((a, b) => {
    const order = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return (
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm h-[550px] flex flex-col">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
        <span className="material-symbols-outlined text-primary">schedule</span>
        Volume por Período
        {activeFilters.turno && (
          <span className="ml-auto text-[10px] bg-primary/20 text-primary px-2 py-1 rounded">Filtro: {activeFilters.turno}</span>
        )}
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={80}
              outerRadius={125}
              paddingAngle={5}
              dataKey="value"
              onClick={(entry) => onDrillDown('turno', entry.name)}
              className="cursor-pointer outline-none"
              label={renderCustomLabel}
              labelLine={false}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  strokeWidth={activeFilters.turno === entry.name ? 4 : 0}
                  stroke="#fff"
                  opacity={activeFilters.turno && activeFilters.turno !== entry.name ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              wrapperStyle={{ paddingTop: '15px', cursor: 'pointer' }}
              onClick={(e) => onDrillDown('turno', e.value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
