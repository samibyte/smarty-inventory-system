import type { RestockPriority } from '@/types';

export function calcPriority(stock: number, threshold: number): RestockPriority {
  if (stock === 0) return 'high';
  const ratio = stock / threshold;
  if (ratio <= 0.25) return 'high';
  if (ratio <= 0.5) return 'medium';
  return 'low';
}

export function isLowStock(stock: number, threshold: number): boolean {
  return stock < threshold;
}
