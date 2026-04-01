import type { RestockPriority } from '@/types';

const config: Record<RestockPriority, { label: string; className: string; dot: string }> = {
  high:   { label: 'High',   className: 'bg-red-50 text-red-600 border-red-200',       dot: 'bg-red-500 animate-pulse' },
  medium: { label: 'Medium', className: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500' },
  low:    { label: 'Low',    className: 'bg-yellow-50 text-yellow-600 border-yellow-200', dot: 'bg-yellow-500' },
};

export function PriorityBadge({ priority }: { priority: RestockPriority }) {
  const c = config[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} inline-block`} />
      {c.label} Priority
    </span>
  );
}
