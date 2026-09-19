"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import type { ProductDto } from "./api";
import { ProductIllustration } from "./product-illustration";

export function ProductCard({ product }: { product: ProductDto }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} tabIndex={-1} aria-hidden>
        <div className="aspect-square overflow-hidden">
          <ProductIllustration
            category={product.category}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
        <Badge variant="secondary" className="w-fit text-xs">
          {product.category}
        </Badge>
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 font-medium leading-snug hover:underline"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <p className="mt-auto pt-2 text-lg font-semibold tabular-nums">
          ${product.price.toFixed(2)}
        </p>
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
