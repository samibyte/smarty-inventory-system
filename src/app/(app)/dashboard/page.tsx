"use client";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Activity,
  ShelvingUnit,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils/date";
import type { ActivityAction } from "@/types";

const actionConfig: Record<ActivityAction, { label: string; dot: string }> = {
  order_created: { label: "Order Created", dot: "bg-primary" },
  order_status_updated: { label: "Status Updated", dot: "bg-secondary" },
  order_cancelled: { label: "Order Cancelled", dot: "bg-destructive" },
  product_created: { label: "Product Added", dot: "bg-accent" },
  product_updated: { label: "Product Updated", dot: "bg-accent" },
  product_deleted: { label: "Product Deleted", dot: "bg-destructive" },
  stock_updated: { label: "Stock Updated", dot: "bg-accent" },
  product_restocked: { label: "Restocked", dot: "bg-accent" },
  restock_queue_added: { label: "Low Stock Alert", dot: "bg-accent" },
  restock_queue_removed: { label: "Queue Cleared", dot: "bg-muted" },
  category_created: { label: "Category Added", dot: "bg-primary" },
  category_deleted: { label: "Category Deleted", dot: "bg-destructive" },
};

export default function DashboardPage() {
  const { stats, isLoading } = useDashboard();

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back — here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Clock}
          colorClass="text-accent"
          bgClass="bg-accent/10"
          description="Awaiting processing"
        />
        <StatCard
          title="Orders Today"
          value={stats.totalOrdersToday}
          icon={ShoppingCart}
          colorClass="text-primary"
          bgClass="bg-primary/10"
          description="New orders placed"
        />
        <StatCard
          title="Revenue Today"
          value={`$${stats.revenueToday.toFixed(2)}`}
          icon={DollarSign}
          colorClass="text-accent"
          bgClass="bg-accent/10"
          description={`${stats.completedOrders} orders delivered`}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          colorClass="text-accent"
          bgClass="bg-accent/10"
          description="Need restocking"
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Revenue Overview
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last 7 days
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              This week
            </div>
          </div>
          <RevenueChart data={stats.revenueChart} />
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Recent Activity
              </h2>
            </div>
            <Link
              href="/activity"
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No activity yet
              </p>
            ) : (
              stats.recentActivity.slice(0, 6).map((log) => {
                const cfg = actionConfig[log.action] || {
                  label: log.action,
                  dot: "bg-muted",
                };
                return (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <div
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground leading-relaxed">
                        {log.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Product Summary */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShelvingUnit className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Product Stock Summary
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {stats.productSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products yet
            </p>
          ) : (
            stats.productSummary.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center">
                    <ShelvingUnit className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {p.stockQuantity} units
                  </span>
                  {p.status === "out_of_stock" ? (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[11px] font-semibold">
                      Out of Stock
                    </Badge>
                  ) : p.isLow ? (
                    <Badge className="bg-accent/10 text-accent border-accent/30 text-[11px] font-semibold">
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge className="bg-accent/10 text-accent border-accent/30 text-[11px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> OK
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
