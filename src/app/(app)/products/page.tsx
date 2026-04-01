"use client";
import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { StockBadge } from "@/components/products/StockBadge";
import { ProductForm } from "@/components/products/ProductForm";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ShelvingUnit } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types";

const LIMIT = 10;

export default function ProductsPage() {
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { products, total, mutate } = useProducts({
    search,
    categoryId: categoryFilter,
    status: statusFilter,
    page,
    limit: LIMIT,
  });

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "—";

  const getStatusLabel = (status: string) => {
    if (status === "active") return "Active";
    if (status === "out_of_stock") return "Out of Stock";
    return "All Status";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Product deleted");
      mutate();
      setDeleteTarget(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => {
    setEditProduct(null);
    setSheetOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setSheetOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog and stock levels"
      >
        <Button
          onClick={openAdd}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-4 rounded-lg shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Product
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 bg-card border border-border rounded-xl p-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search products..."
          className="flex-1 min-w-40"
        />
        <Select
          value={categoryFilter || "all"}
          onValueChange={(v) => {
            setCategoryFilter(v && v !== "all" ? v : "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44 h-9 border-border text-sm">
            <SelectValue placeholder="All Categories">
              {categoryFilter
                ? categories.find((c) => c.id === categoryFilter)?.name
                : "All Categories"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => {
            setStatusFilter(v && v !== "all" ? v : "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 h-9 border-border text-sm">
            <SelectValue placeholder="All Status">
              {statusFilter ? getStatusLabel(statusFilter) : "All Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {products.length === 0 ? (
          <EmptyState
            icon={ShelvingUnit}
            title="No products found"
            description="Add your first product or adjust the filters."
          >
            <Button
              onClick={openAdd}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Product
            </Button>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/80 border-b border-border">
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stock
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Min
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-muted/60 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <ShelvingUnit className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground text-sm">
                          {p.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        {getCategoryName(p.categoryId)}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      ${p.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StockBadge
                        stock={p.stockQuantity}
                        threshold={p.minStockThreshold}
                        status={p.status}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.minStockThreshold}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          p.status === "active"
                            ? "bg-accent/10 text-accent border-accent/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {p.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold">
              {editProduct ? "Edit Product" : "Add New Product"}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <ProductForm
              product={editProduct || undefined}
              onSuccess={() => {
                setSheetOpen(false);
                mutate();
              }}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        loading={deleting}
      />
    </div>
  );
}
