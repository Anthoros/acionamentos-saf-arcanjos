
import { TicketData, DashboardStats } from '../types';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgDdiQWX1AhvT_MdzZ2EYpVKi_EmwKdW6tRRfbaR0JTEUmIIGPgO3DL_f3una601MrZMPOQYI8qWJw/pub?gid=252607289&single=true&output=csv';

export const fetchData = async (): Promise<TicketData[]> => {
  try {
    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch CSV data');
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    // Normalize headers by removing quotes and trimming
    const headers = lines[0].replace(/"/g, '').split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      // Robust split that ignores commas inside quotes
      const values = line.replace(/\r$/, '').split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const obj: any = {};
      headers.forEach((header, index) => {
        const val = values[index]?.replace(/^"|"$/g, '').trim() || '';
        if (header === 'data_abertura') obj.data_abertura = val;
        else if (header === 'hora_abertura') obj.hora_abertura = val;
        else if (header === 'marca') obj.marca = val;
        else if (header === 'sistema') obj.sistema = val;
        else if (header === 'categoria') obj.categoria = val;
        else if (header === 'unidade') obj.unidade = val;
        else if (header === 'turno') obj.turno = val;
        else if (header === 'detalhamento' || index === 8) obj.detalhamento = val;
        else obj[header] = val;
      });
      return obj as TicketData;
    }).filter(item => {
      // Filtering out "SUM" rows or error indicators from the spreadsheet bottom
      const isMarcaSum = item.marca?.toLowerCase() === 'sum';
      const isDataSum = item.data_abertura?.toLowerCase() === 'sum';
      return item.marca && !isMarcaSum && !isDataSum;
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

export const getLastUpdateInfo = (data: TicketData[]) => {
  if (data.length === 0) return "Sem dados";
  
  // Find the most recent record by date and time
  const sorted = [...data].sort((a, b) => {
    const parseDateTime = (d: string, t?: string) => {
      const parts = d.split(/[-/]/);
      if (parts.length < 3) return new Date(0);
      const [dia, mes, ano] = parts;
      // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD for standard Date constructor
      const isoDate = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      return new Date(`${isoDate}T${t || '00:00:00'}`);
    };

    const dateA = parseDateTime(a.data_abertura, a.hora_abertura);
    const dateB = parseDateTime(b.data_abertura, b.hora_abertura);
    return dateB.getTime() - dateA.getTime();
  });

  const last = sorted[0];
  const timeInfo = last.hora_abertura ? ` às ${last.hora_abertura}` : '';
  return `${last.data_abertura}${timeInfo}`;
};

export const calculateStats = (data: TicketData[]): DashboardStats => {
  const stats: DashboardStats = {
    totalTickets: data.length,
    brandCounts: {},
    systemCounts: {},
    reasonCounts: {},
    categorySystems: {},
    storeCounts: {},
    periodCounts: {},
    detailCounts: {}
  };

  const systemMap: Record<string, Set<string>> = {};

  data.forEach(item => {
    const brand = item.marca || 'Unknown';
    stats.brandCounts[brand] = (stats.brandCounts[brand] || 0) + 1;

    let system = 'OUTROS';
    if (item.sistema) {
      const s = item.sistema.toUpperCase();
      if (s.includes('GCOM')) system = 'GCOM';
      else if (s.includes('VS') || s.includes('VIDEOSOFT')) system = 'VIDEOSOFT';
      else if (s.includes('INFRA')) system = 'INFRAESTRUTURA';
      else if (s.includes('TRIGO')) system = 'TRIGO';
      else if (s.includes('ALPHACODE')) system = 'ALPHACODE';
      else if (s.includes('BRASPAG')) system = 'BRASPAG';
      else if (s.includes('CARDÁPIO')) system = 'CARDÁPIO';
      else if (s.includes('DELIVERY')) system = 'DELIVERY';
      else if (s.includes('FIDELIDADE')) system = 'FIDELIDADE';
      else if (s.includes('MYORDERS')) system = 'MYORDERS';
      else {
        const parts = s.split(' ');
        system = parts[parts.length - 1] || 'OUTROS';
      }
    }
    stats.systemCounts[system] = (stats.systemCounts[system] || 0) + 1;

    const reason = item.categoria || 'Sem Categoria';
    stats.reasonCounts[reason] = (stats.reasonCounts[reason] || 0) + 1;

    // Map systems to categories
    if (!systemMap[reason]) systemMap[reason] = new Set();
    systemMap[reason].add(system);

    const store = item.unidade || 'Sem Unidade';
    stats.storeCounts[store] = (stats.storeCounts[store] || 0) + 1;

    const period = item.turno || 'Sem Turno';
    stats.periodCounts[period] = (stats.periodCounts[period] || 0) + 1;

    // Sanitized detailing logic
    const detail = item.detalhamento;
    const isInvalid = !detail || 
                     detail.toLowerCase().includes('sem detalha') || 
                     detail.toLowerCase() === 'null' ||
                     detail.trim() === '';
    
    if (!isInvalid) {
      stats.detailCounts[detail] = (stats.detailCounts[detail] || 0) + 1;
    }
  });

  // Convert Sets to Arrays for visual component
  Object.keys(systemMap).forEach(reason => {
    stats.categorySystems[reason] = Array.from(systemMap[reason]);
  });

  return stats;
};
