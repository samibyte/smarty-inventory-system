"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  categorySchema,
  type CategoryInput,
} from "@/lib/validations/category.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CategoryFormProps {
  onSuccess: () => void;
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    mode: "onBlur",
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: CategoryInput) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create category");
        return;
      }
      toast.success("Category created");
      reset();
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <div className="flex-1">
        <Input
          id="name"
          placeholder="Category name (e.g. Electronics)"
          className="h-10 bg-muted focus:bg-background"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {isSubmitting ? "Adding..." : "Add Category"}
      </Button>
    </form>
  );
}
