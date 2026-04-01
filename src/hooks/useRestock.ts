import useSWR from 'swr';
import type { RestockEntry } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRestock() {
  const { data, error, isLoading, mutate } = useSWR<{ data: RestockEntry[] }>('/api/restock', fetcher);
  return {
    queue: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
