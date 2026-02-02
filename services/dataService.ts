
import { TicketData, DashboardStats } from '../types.ts';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgDdiQWX1AhvT_MdzZ2EYpVKi_EmwKdW6tRRfbaR0JTEUmIIGPgO3DL_f3una601MrZMPOQYI8qWJw/pub?gid=252607289&single=true&output=csv';

const TOTAL_STORES_MAP: Record<string, number> = {
  'spoleto': 416,
  'asa': 17,
  'china in box': 160,
  'koni': 41,
  'gendai': 121,
  'grupo trigo': 755 // Soma de todos
};

export const fetchData = async (): Promise<TicketData[]> => {
  try {
    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch CSV data');
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length === 0) return [];

    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    // Normalize headers by removing quotes and trimming
    const headers = lines[0].replace(/"/g, '').split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      // Robust split that ignores commas inside quotes
      const values = line.replace(/\r$/, '').split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const obj: any = {};
      headers.forEach((header, index) => {
        const val = (values[index] || '').replace(/^"|"$/g, '').trim();
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
      // Filtering out invalid rows
      if (!item || !item.marca || !item.data_abertura) return false;
      const isMarcaSum = item.marca.toLowerCase() === 'sum';
      const isDataSum = item.data_abertura.toLowerCase() === 'sum';
      return !isMarcaSum && !isDataSum;
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

export const getLastUpdateInfo = (data: TicketData[]) => {
  if (!data || data.length === 0) return "Sem dados";
  
  const parseDateTime = (d: string, t?: string) => {
    if (!d) return new Date(0);
    const parts = d.split(/[-/]/);
    if (parts.length < 3) return new Date(0);
    const [dia, mes, ano] = parts;
    const isoDate = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    const dt = new Date(`${isoDate}T${t || '00:00:00'}`);
    return isNaN(dt.getTime()) ? new Date(0) : dt;
  };

  const sorted = [...data].sort((a, b) => {
    const dateA = parseDateTime(a.data_abertura, a.hora_abertura);
    const dateB = parseDateTime(b.data_abertura, b.hora_abertura);
    return dateB.getTime() - dateA.getTime();
  });

  const last = sorted[0];
  if (!last) return "Sem dados";
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
    detailCounts: {},
    uniqueStoreCounts: {},
    totalStoresMap: TOTAL_STORES_MAP,
    storeToBrandMap: {}
  };

  if (!data || data.length === 0) return stats;

  const systemMap: Record<string, Set<string>> = {};
  const uniqueStoresByBrand: Record<string, Set<string>> = {
    'grupo trigo': new Set<string>()
  };

  data.forEach(item => {
    if (!item) return;

    const rawBrand = item.marca || 'Unknown';
    let brand = rawBrand.toLowerCase();
    
    // Armazena o vínculo oficial entre unidade e marca
    if (item.unidade && item.marca) {
      stats.storeToBrandMap[item.unidade] = rawBrand;
    }

    // Normalization logic for matching TOTAL_STORES_MAP
    if (brand.includes('china')) brand = 'china in box';
    if (brand.includes('spoleto')) brand = 'spoleto';
    if (brand.includes('koni')) brand = 'koni';
    if (brand.includes('gendai')) brand = 'gendai';
    if (brand.includes('asa')) brand = 'asa';

    stats.brandCounts[rawBrand] = (stats.brandCounts[rawBrand] || 0) + 1;

    // Normalização agressiva da unidade
    const store = item.unidade
      ?.toUpperCase()
      .replace(/\s+/g, ' ')
      .replace(/[-]/g, '')
      .trim();

    // Ignora linhas de "SUM" ou vazias que podem vir da planilha
    if (store && store !== 'SUM' && store !== 'TOTAL') {
      if (!uniqueStoresByBrand[brand]) uniqueStoresByBrand[brand] = new Set();
      uniqueStoresByBrand[brand].add(store);
      uniqueStoresByBrand['grupo trigo'].add(`${brand}-${store}`);
    }

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
        const parts = s.trim().split(' ');
        system = parts[parts.length - 1] || 'OUTROS';
      }
    }
    stats.systemCounts[system] = (stats.systemCounts[system] || 0) + 1;

    const reason = item.categoria || 'Sem Categoria';
    stats.reasonCounts[reason] = (stats.reasonCounts[reason] || 0) + 1;

    if (!systemMap[reason]) systemMap[reason] = new Set();
    systemMap[reason].add(system);

    const storeForCounts = item.unidade || 'Sem Unidade';
    stats.storeCounts[storeForCounts] = (stats.storeCounts[storeForCounts] || 0) + 1;

    const period = item.turno || 'Sem Turno';
    stats.periodCounts[period] = (stats.periodCounts[period] || 0) + 1;

    const detail = item.detalhamento;
    const isInvalid = !detail || 
                     detail.toLowerCase().includes('sem detalha') || 
                     detail.toLowerCase() === 'null' ||
                     detail.trim() === '';
    
    if (!isInvalid) {
      stats.detailCounts[detail] = (stats.detailCounts[detail] || 0) + 1;
    }
  });

  Object.keys(systemMap).forEach(reason => {
    stats.categorySystems[reason] = Array.from(systemMap[reason]);
  });

  // Convert Sets to counts for the uniqueStoreCounts stat
  Object.keys(uniqueStoresByBrand).forEach(brandKey => {
    stats.uniqueStoreCounts[brandKey] = uniqueStoresByBrand[brandKey].size;
  });

  return stats;
};
