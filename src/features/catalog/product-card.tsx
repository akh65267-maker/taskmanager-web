"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import type { ProductDto } from "./api";

export function ProductCard({ product }: { product: ProductDto }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="flex aspect-square items-center justify-center bg-muted text-sm text-muted-foreground">
          No image
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-1 p-4">
        <Badge variant="secondary" className="w-fit">
          {product.category}
        </Badge>
        <Link href={`/products/${product.id}`} className="font-medium hover:underline">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <p className="mt-auto pt-2 font-semibold">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="px-4 pb-4">
        <Button
          className="w-full"
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
      </CardFooter>
    </Card>
  );
}
