import useSWR from 'swr';
import type { Category } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Category[] }>('/api/categories', fetcher);
  return {
    categories: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
