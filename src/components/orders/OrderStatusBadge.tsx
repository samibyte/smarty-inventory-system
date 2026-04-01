import type { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  shipped:   { label: 'Shipped',   className: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-500' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status] || { label: status, className: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
      {cfg.label}
    </span>
  );
}
