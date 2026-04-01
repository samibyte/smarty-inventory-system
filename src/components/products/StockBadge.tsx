interface StockBadgeProps {
  stock: number;
  threshold: number;
  status: string;
}

export function StockBadge({ stock, threshold, status }: StockBadgeProps) {
  if (status === 'out_of_stock' || stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Out of Stock
      </span>
    );
  }
  if (stock < threshold) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block animate-pulse" />
        Low — {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      {stock} in stock
    </span>
  );
}
