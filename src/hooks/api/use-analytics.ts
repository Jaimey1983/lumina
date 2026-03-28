import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardMessage {
  id: string;
  subject: string;
  from: string;
  createdAt: string;
}

export interface Analytics {
  avgGrade: number;
  totalMessages: number;
  recentMessages: DashboardMessage[];
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await api.get<Analytics>('/analytics');
      return data;
    },
  });
}
