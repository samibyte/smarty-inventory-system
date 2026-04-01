"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  type ProductInput,
} from "@/lib/validations/product.schema";
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
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import type { Product } from "@/types";

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const { categories } = useCategories();
  const isEdit = !!product;

  const defaultValues: ProductInput = {
    name: product?.name || "",
    categoryId: product?.categoryId || "",
    price: product?.price ?? 0,
    stockQuantity: product?.stockQuantity ?? 0,
    minStockThreshold: product?.minStockThreshold ?? 1,
    status: product?.status || "active",
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [product, reset]);

  const onSubmit = async (values: ProductInput) => {
    try {
      const url = isEdit ? `/api/products/${product?.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save product");
        return;
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm font-semibold text-foreground">
            Product Name
          </Label>
          <Input
            id="name"
            placeholder="e.g. iPhone 13"
            className="h-10 bg-muted focus:bg-background"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Category
          </Label>
          <Select
            value={watch("categoryId")}
            onValueChange={(v) =>
              setValue("categoryId", v as string, { shouldValidate: true })
            }
          >
            <SelectTrigger className="h-10 bg-muted focus:bg-background">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-xs text-destructive">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Price ($)
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="h-10 bg-muted focus:bg-background"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Stock Quantity
          </Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            placeholder="0"
            className="h-10 bg-muted focus:bg-background"
            {...register("stockQuantity", { valueAsNumber: true })}
          />
          {errors.stockQuantity && (
            <p className="text-xs text-destructive">
              {errors.stockQuantity.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Min Stock Threshold
          </Label>
          <Input
            id="minStockThreshold"
            type="number"
            min="1"
            placeholder="5"
            className="h-10 bg-muted focus:bg-background"
            {...register("minStockThreshold", { valueAsNumber: true })}
          />
          {errors.minStockThreshold && (
            <p className="text-xs text-destructive">
              {errors.minStockThreshold.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Status
          </Label>
          <Select
            value={watch("status")}
            onValueChange={(v) =>
              setValue("status", v as "active" | "out_of_stock", {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="h-10 bg-muted focus:bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-xs text-destructive">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold sm:flex-1"
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Update Product"
              : "Add Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
