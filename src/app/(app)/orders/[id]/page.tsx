"use client";
import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, User, Calendar, ShelvingUnit } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils/date";
import type { Order, OrderStatus } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const transitionConfig: Record<string, { className: string; label: string }> = {
  confirmed: {
    className: "bg-primary hover:bg-primary/90 text-primary-foreground",
    label: "Confirm",
  },
  shipped: {
    className: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
    label: "Ship",
  },
  delivered: {
    className: "bg-accent hover:bg-accent/90 text-accent-foreground",
    label: "Mark Delivered",
  },
  cancelled: {
    className:
      "bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30",
    label: "Cancel Order",
  },
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, mutate } = useSWR<{ data: Order }>(
    `/api/orders/${id}`,
    fetcher,
  );
  const [updating, setUpdating] = useState(false);
  const order = data?.data;

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update status");
        return;
      }
      toast.success(`Order updated to ${newStatus}`);
      mutate();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  const allowedNext = STATUS_TRANSITIONS[order.status as OrderStatus] || [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description="Order details and status management"
      >
        <Link href="/orders">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </Link>
      </PageHeader>

      <div className="space-y-4">
        {/* Summary card */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">
            Order Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Customer
                </p>
                <p className="font-semibold text-foreground text-sm">
                  {order.customerName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Date
                </p>
                <p className="font-semibold text-foreground text-sm">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                Status
              </p>
              <OrderStatusBadge status={order.status as OrderStatus} />
            </div>
            {allowedNext.length > 0 && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground mr-1">Move to:</p>
                {allowedNext.map((s) => {
                  const cfg = transitionConfig[s] || {
                    className: "bg-muted text-foreground",
                    label: s,
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={updating}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${cfg.className}`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <ShelvingUnit className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Order Items</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/80 border-b border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Qty
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow
                    key={item.productId}
                    className="hover:bg-muted/60 transition-colors"
                  >
                    <TableCell className="font-semibold text-foreground text-sm">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      ${item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="font-bold text-foreground text-right">
                      ${item.subtotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/60">
            <span className="text-sm font-semibold text-muted-foreground">
              Order Total
            </span>
            <span className="text-xl font-bold text-foreground">
              ${order.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
