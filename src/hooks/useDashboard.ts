import useSWR from 'swr';
import type { DashboardStats } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<{ data: DashboardStats }>('/api/dashboard', fetcher);
  return {
    stats: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}
