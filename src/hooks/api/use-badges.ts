import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  points: number;
  earnedAt: string;
}

export interface BadgesResponse {
  badges: UserBadge[];
  totalPoints: number;
}

export function useMyBadges() {
  return useQuery({
    queryKey: ['badges', 'my'],
    queryFn: async () => {
      const { data } = await api.get<BadgesResponse>('/badges/my');
      return data ?? { badges: [], totalPoints: 0 };
    },
  });
}
