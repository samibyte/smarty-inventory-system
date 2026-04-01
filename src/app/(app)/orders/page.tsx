"use client";
import { useState } from "react";
import Link from "next/link";
import { useOrders } from "@/hooks/useOrders";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ShoppingCart, Eye, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils/date";
import type { Order, OrderStatus } from "@/types";

const LIMIT = 10;
const TABS = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const { orders, total, mutate } = useOrders({
    status: statusTab,
    search,
    page,
    limit: LIMIT,
  });

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${cancelTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to cancel order");
        return;
      }
      toast.success("Order cancelled — stock restored");
      mutate();
      setCancelTarget(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <PageHeader title="Orders" description="Manage and track customer orders">
        <Link href="/orders/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-4 rounded-lg shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Order
          </Button>
        </Link>
      </PageHeader>

      {/* Status tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setStatusTab(t.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusTab === t.value
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by customer name or order #..."
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="Create your first order or adjust the filters."
          >
            <Link href="/orders/new">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Order
              </Button>
            </Link>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Order #
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Customer
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Items
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-bold text-indigo-600">
                        {o.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {o.customerName}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">
                      ${o.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status as OrderStatus} />
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/orders/${o.id}`}>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        {o.status !== "cancelled" &&
                          o.status !== "delivered" && (
                            <button
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              onClick={() => setCancelTarget(o)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        limit={LIMIT}
        total={total}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Order"
        description={`Cancel order ${cancelTarget?.orderNumber}? Stock will be automatically restored.`}
        confirmText="Cancel Order"
        loading={cancelling}
      />
    </div>
  );
}
