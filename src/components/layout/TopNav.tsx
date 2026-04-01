"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick = () => {} }: TopNavProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to sign out");
      }

      setMenuOpen(false);
      logout();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-10">
      <button
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        onClick={onMenuClick}
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 hidden sm:block font-medium">
          {user?.name}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            className="h-8 w-8 rounded-full flex items-center justify-center outline-none ring-2 ring-transparent hover:ring-indigo-200 transition-all"
            onClick={() => setMenuOpen((prev) => !prev)}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open user menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-linear-to-br from-primary to-secondary-foreground text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg z-50"
              role="menu"
            >
              <div className="px-2 py-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">
                    {user?.name}
                  </span>
                  <span className="text-xs text-slate-500 font-normal">
                    {user?.email}
                  </span>
                </div>
              </div>
              <div className="my-1 h-px bg-slate-200" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
