
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardStats } from '../types';

interface ChartProps {
  stats: DashboardStats;
  onDrillDown: (type: string, value: string) => void;
  activeDrill: { type: string | null; value: string | null };
}

const SYSTEM_COLORS: Record<string, string> = {
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

export const SystemDistribution: React.FC<ChartProps> = ({ stats, onDrillDown, activeDrill }) => {
  const data = (Object.entries(stats.systemCounts) as [string, number][])
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col h-[550px]">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
        <span className="material-symbols-outlined text-primary">donut_large</span>
        Distribuição por Sistema
        {activeDrill.type === 'sistema' && (
          <span className="ml-auto text-[10px] bg-primary/20 text-primary px-2 py-1 rounded">Filtro: {activeDrill.value}</span>
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
                  strokeWidth={activeDrill.value === entry.name ? 4 : 0}
                  stroke="#fff"
                  opacity={activeDrill.type === 'sistema' && activeDrill.value !== entry.name ? 0.3 : 1}
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

export const TopReasons: React.FC<ChartProps> = ({ stats, onDrillDown, activeDrill }) => {
  const isDetailMode = activeDrill.type === 'categoria';
  const dataSource = isDetailMode ? stats.detailCounts : stats.reasonCounts;

  const sortedReasons = (Object.entries(dataSource) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxVal = Math.max(...sortedReasons.map(r => r[1]), 1);

  return (
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm h-[550px] flex flex-col">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white overflow-hidden">
        <span className="material-symbols-outlined text-primary shrink-0">
          {isDetailMode ? 'manage_search' : 'bar_chart'}
        </span>
        <span className="truncate">
          {isDetailMode ? `Detalhes: ${activeDrill.value}` : 'Principais Motivos'}
        </span>
        {isDetailMode && (
          <button 
            onClick={() => onDrillDown('categoria', activeDrill.value!)}
            className="ml-auto text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors shrink-0 font-black uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[12px]">arrow_back</span>
            VOLTAR
          </button>
        )}
      </h3>
      <div className="flex flex-col justify-between flex-1 pb-2 gap-1">
        {sortedReasons.map(([name, count], idx) => (
          <button 
            key={idx} 
            onClick={() => !isDetailMode && onDrillDown('categoria', name)}
            className={`relative w-full text-left group transition-all p-1 hover:bg-slate-800/30 rounded ${isDetailMode ? 'cursor-default' : 'cursor-pointer'}`}
            disabled={isDetailMode}
          >
            <div className="flex justify-between text-[10px] mb-1 uppercase font-black tracking-tight">
              <span className={`truncate pr-4 max-w-[80%] transition-colors ${activeDrill.value === name && !isDetailMode ? 'text-accent-cyan' : 'text-slate-400 group-hover:text-slate-200'}`}>{name}</span>
              <span className="text-white shrink-0">{count}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isDetailMode ? 'bg-accent-cyan' : 'bg-primary'}`} 
                style={{ width: `${(count / maxVal) * 100}%` }}
              ></div>
            </div>
          </button>
        ))}
        {sortedReasons.length === 0 && isDetailMode && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-sm">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
            Sem detalhamento disponível
          </div>
        )}
      </div>
    </div>
  );
};

export const TopStores: React.FC<ChartProps> = ({ stats, onDrillDown, activeDrill }) => {
  const sortedStores = (Object.entries(stats.storeCounts) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm min-h-[600px] flex flex-col">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
        <span className="material-symbols-outlined text-primary">store</span>
        Unidades com maior volume
      </h3>
      <div className="flex-1 flex flex-col gap-2 pb-2">
        {sortedStores.map(([name, count], idx) => (
          <button 
            key={idx} 
            onClick={() => onDrillDown('unidade', name)}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all group active:scale-[0.98] ${
              activeDrill.value === name ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-slate-800/40 border-slate-700/30 hover:bg-card-dark'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center size-6 rounded-full ${idx === 0 || activeDrill.value === name ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-700/50 text-slate-400'} font-black text-[10px]`}>
                {idx + 1}
              </span>
              <p className={`text-[11px] font-bold uppercase truncate transition-colors ${activeDrill.value === name ? 'text-primary' : 'text-slate-200 group-hover:text-accent-cyan'}`}>{name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">{count}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const PeriodDistribution: React.FC<ChartProps> = ({ stats, onDrillDown, activeDrill }) => {
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
    <div className="bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-sm min-h-[600px] flex flex-col">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
        <span className="material-symbols-outlined text-primary">schedule</span>
        Volume por Período
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={75}
              outerRadius={115}
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
                  strokeWidth={activeDrill.value === entry.name ? 4 : 0}
                  stroke="#fff"
                  opacity={activeDrill.type === 'turno' && activeDrill.value !== entry.name ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }}
              onClick={(e) => onDrillDown('turno', e.value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-6 border-t border-slate-800 pt-6">
        {data.map((item, idx) => (
          <div key={idx} className="text-center group">
            <p className="text-[10px] font-black text-secondary-text uppercase truncate tracking-tighter transition-colors group-hover:text-white">{item.name}</p>
            <p className="text-lg font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
