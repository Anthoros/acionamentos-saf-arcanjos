
export interface TicketData {
  data_abertura: string;
  marca: string;
  sistema: string;
  categoria: string;
  unidade: string;
  turno: string;
}

export interface DashboardStats {
  totalTickets: number;
  brandCounts: Record<string, number>;
  systemCounts: Record<string, number>;
  reasonCounts: Record<string, number>;
  storeCounts: Record<string, number>;
  periodCounts: Record<string, number>;
}
