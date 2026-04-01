import useSWR from "swr";
import type { ActivityLog } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ActivityResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

export function useActivity(page = 1, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR<ActivityResponse>(
    `/api/activity?page=${page}&limit=${limit}`,
    fetcher,
  );

  return {
    logs: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    limit: data?.limit || limit,
    isLoading,
    error,
    mutate,
  };
}
