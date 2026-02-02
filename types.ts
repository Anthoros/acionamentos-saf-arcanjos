
export interface TicketData {
  data_abertura: string;
  hora_abertura?: string;
  marca: string;
  sistema: string;
  categoria: string;
  unidade: string;
  turno: string;
  detalhamento: string;
}

export interface DashboardStats {
  totalTickets: number;
  brandCounts: Record<string, number>;
  systemCounts: Record<string, number>;
  reasonCounts: Record<string, number>;
  categorySystems: Record<string, string[]>;
  storeCounts: Record<string, number>;
  periodCounts: Record<string, number>;
  detailCounts: Record<string, number>;
  uniqueStoreCounts: Record<string, number>;
  totalStoresMap: Record<string, number>;
  storeToBrandMap: Record<string, string>;
}
