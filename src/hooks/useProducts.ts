import useSWR from 'swr';
import type { Product } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export function useProducts(params?: {
  search?: string;
  categoryId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.categoryId) query.set('categoryId', params.categoryId);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const url = `/api/products?${query.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(url, fetcher);

  return {
    products: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}
