"use client";

import { use } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/features/catalog/use-products";
import { useCartStore } from "@/store/cart-store";

export default function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const { id } = use(props.params);
  const { data: product, isLoading, isError } = useProduct(id);
  const addItem = useCartStore((state) => state.addItem);

  if (isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
        Product not found.
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
      <div className="flex aspect-square items-center justify-center bg-muted text-sm text-muted-foreground">
        No image
      </div>

      <div className="flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit">
          {product.category}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="text-2xl font-semibold">${product.price.toFixed(2)}</p>
        <p className="text-muted-foreground">{product.description}</p>

        <Button
          size="lg"
          className="mt-4 w-fit"
          onClick={() => {
            addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
            });
            toast.success(`${product.name} added to cart`);
          }}
        >
          Add to cart
        </Button>
      </div>
    </div>
  );
}
