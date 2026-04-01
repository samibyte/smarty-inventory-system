"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderInput } from "@/lib/validations/order.schema";
import { useProducts } from "@/hooks/useProducts";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  ShoppingCart,
  User,
} from "lucide-react";
import type { Product } from "@/types";
import Link from "next/link";

interface LineItem {
  product: Product;
  quantity: number;
  error?: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { products } = useProducts({ status: "active", limit: 1000 });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [globalError, setGlobalError] = useState("");

  const availableProducts = products.filter(
    (p) => !lineItems.find((li) => li.product.id === p.id),
  );

  const addProduct = useCallback(() => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    if (product.status !== "active") {
      toast.error("This product is currently unavailable.");
      return;
    }
    if (lineItems.find((li) => li.product.id === product.id)) {
      toast.error("This product is already added to the order.");
      return;
    }
    setLineItems((prev) => [...prev, { product, quantity: 1 }]);
    setSelectedProductId("");
    setGlobalError("");
  }, [selectedProductId, products, lineItems]);

  const removeItem = (productId: string) => {
    setLineItems((prev) => prev.filter((li) => li.product.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.product.id !== productId) return li;
        let error: string | undefined;
        if (qty > li.product.stockQuantity) {
          error = `Only ${li.product.stockQuantity} available.`;
        }
        return { ...li, quantity: qty, error };
      }),
    );
  };

  const totalPrice = lineItems.reduce(
    (sum, li) => sum + li.product.price * li.quantity,
    0,
  );
  const hasErrors = lineItems.some((li) => !!li.error);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Pick<OrderInput, "customerName">>({
    resolver: zodResolver(orderSchema.pick({ customerName: true })),
    mode: "onBlur",
    defaultValues: { customerName: "" },
  });

  const onSubmit = async (values: OrderInput) => {
    if (lineItems.length === 0) {
      setGlobalError("Add at least one product.");
      return;
    }
    if (hasErrors) {
      setGlobalError("Fix stock errors before submitting.");
      return;
    }

    setGlobalError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: values.customerName,
          items: lineItems.map((li) => ({
            productId: li.product.id,
            quantity: li.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create order");
        return;
      }

      toast.success(`Order ${data.data.orderNumber} created!`);
      router.push("/orders");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="New Order" description="Create a new customer order">
        <Link href="/orders">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Customer Details */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-foreground">
              Customer Details
            </h2>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Customer Name
            </Label>
            <Input
              id="customerName"
              placeholder="e.g. John Doe"
              autoComplete="name"
              className="h-10 bg-muted focus:bg-background"
              {...register("customerName")}
            />
            {errors.customerName && (
              <p className="text-xs text-destructive">
                {errors.customerName.message}
              </p>
            )}
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Order Items</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <Select
              value={selectedProductId}
              onValueChange={(v) => setSelectedProductId(v || "")}
            >
              <SelectTrigger className="flex-1 h-10 bg-muted focus:bg-background">
                <SelectValue placeholder="Select a product to add..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No more products available
                  </SelectItem>
                ) : (
                  availableProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — ${p.price.toFixed(2)} ({p.stockQuantity} in
                      stock)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={addProduct}
              disabled={!selectedProductId}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-40 rounded-lg transition-colors h-10"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/60 rounded-xl border border-dashed border-border">
              <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No products added yet
              </p>
              <p className="text-xs text-muted-foreground">
                Select a product above and click Add
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lineItems.map((li) => (
                <div
                  key={li.product.id}
                  className={`rounded-xl border p-3.5 transition-colors ${li.error ? "border-destructive/30 bg-destructive/10" : "border-border bg-muted/40"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {li.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${li.product.price.toFixed(2)} each ·{" "}
                        {li.product.stockQuantity} in stock
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(li.product.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Qty
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={li.product.stockQuantity}
                        value={li.quantity}
                        onChange={(e) =>
                          updateQty(
                            li.product.id,
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-20 h-8 text-sm"
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground ml-auto">
                      ${(li.product.price * li.quantity).toFixed(2)}
                    </span>
                  </div>
                  {li.error && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {li.error}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                <span className="text-sm font-semibold text-muted-foreground">
                  Order Total
                </span>
                <span className="text-xl font-bold text-foreground">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {globalError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {globalError}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || hasErrors}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10"
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </Button>
          <Link href="/orders">
            <Button type="button" variant="outline" className="h-10">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
