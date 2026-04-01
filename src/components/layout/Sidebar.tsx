"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Tag,
  ShoppingCart,
  RefreshCw,
  Activity,
  X,
  TrendingUp,
  ShelvingUnit,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: ShelvingUnit },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/restock", label: "Restock Queue", icon: RefreshCw },
  { href: "/activity", label: "Activity Log", icon: Activity },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 flex flex-col z-30 transition-transform duration-200",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg p-1.5 shadow-md">
              <ShelvingUnit className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">
                Smart Inventory
              </span>
              <p className="text-xs text-sidebar-foreground/60">
                Management System
              </p>
            </div>
          </div>

          <button
            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground p-1 rounded-md hover:bg-sidebar-accent transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pb-2 text-sidebar-foreground/50">
            Main Menu
          </p>

          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href + "/"));

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive
                      ? "text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/50",
                  )}
                />

                {label}

                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-sidebar-primary-foreground rounded-full opacity-70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-sidebar-accent">
            <div className="bg-sidebar-primary/20 rounded-md p-1.5">
              <ShelvingUnit className="h-3.5 w-3.5 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-xs font-medium">Smart Inventory System</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
