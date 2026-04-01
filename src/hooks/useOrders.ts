import useSWR from 'swr';
import type { Order } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export function useOrders(params?: {
  status?: string;
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.date) query.set('date', params.date);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const url = `/api/orders?${query.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(url, fetcher);

  return {
    orders: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}
