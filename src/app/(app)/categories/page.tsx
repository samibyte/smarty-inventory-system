"use client";
import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tag, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/date";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const { categories, mutate } = useCategories();
  const { products } = useProducts({ limit: 1000 });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const getProductCount = (catId: string) =>
    products.filter((p) => p.categoryId === catId).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Category deleted");
      mutate();
      setDeleteTarget(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage your product categories"
      >
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors h-9"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </PageHeader>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            New Category
          </h3>
          <CategoryForm
            onSuccess={() => {
              mutate();
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/* Category list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            All Categories ({categories.length})
          </span>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No categories yet"
            description="Create your first category to get started."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map((cat) => {
              const count = getProductCount(cat.id);
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                      <Tag className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {cat.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Added {formatDate(cat.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {count} product{count !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      disabled={count > 0}
                      title={
                        count > 0
                          ? "Remove all products first"
                          : "Delete category"
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
