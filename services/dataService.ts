
import { TicketData, DashboardStats } from '../types';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgDdiQWX1AhvT_MdzZ2EYpVKi_EmwKdW6tRRfbaR0JTEUmIIGPgO3DL_f3una601MrZMPOQYI8qWJw/pub?gid=252607289&single=true&output=csv';

export const fetchData = async (): Promise<TicketData[]> => {
  try {
    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch CSV data');
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        const val = values[index]?.trim();
        if (header === 'data_abertura') obj.data_abertura = val;
        else if (header === 'marca') obj.marca = val;
        else if (header === 'sistema') obj.sistema = val;
        else if (header === 'categoria') obj.categoria = val;
        else if (header === 'unidade') obj.unidade = val;
        else if (header === 'turno') obj.turno = val;
        else obj[header] = val;
      });
      return obj as TicketData;
    }).filter(item => item.marca);
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

export const calculateStats = (data: TicketData[]): DashboardStats => {
  const stats: DashboardStats = {
    totalTickets: data.length,
    brandCounts: {},
    systemCounts: {},
    reasonCounts: {},
    storeCounts: {},
    periodCounts: {}
  };

  data.forEach(item => {
    const brand = item.marca || 'Unknown';
    stats.brandCounts[brand] = (stats.brandCounts[brand] || 0) + 1;

    // Clean and normalize system names to uppercase for color mapping consistency
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
        // Fallback to the last word if it's a specific system name
        const parts = s.split(' ');
        system = parts[parts.length - 1] || 'OUTROS';
      }
    }
    stats.systemCounts[system] = (stats.systemCounts[system] || 0) + 1;

    const reason = item.categoria || 'Sem Categoria';
    stats.reasonCounts[reason] = (stats.reasonCounts[reason] || 0) + 1;

    const store = item.unidade || 'Sem Unidade';
    stats.storeCounts[store] = (stats.storeCounts[store] || 0) + 1;

    const period = item.turno || 'Sem Turno';
    stats.periodCounts[period] = (stats.periodCounts[period] || 0) + 1;
  });

  return stats;
};
