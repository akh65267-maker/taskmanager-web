"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore, useCartSubtotal } from "@/store/cart-store";
import { useCreateOrder } from "@/features/orders/use-orders";
import { getApiErrorMessage } from "@/lib/api-error";

export default function CheckoutPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const subtotal = useCartSubtotal();
  const createOrder = useCreateOrder();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  function handlePlaceOrder() {
    createOrder.mutate(
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      {
        onSuccess: ({ id }) => {
          clearCart();
          router.push(`/orders/${id}`);
        },
      },
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button className="mt-4" render={<Link href="/products">Continue shopping</Link>} nativeButton={false} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Review your order</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col divide-y">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <Separator />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {createOrder.isError && (
            <p className="text-sm text-destructive">{getApiErrorMessage(createOrder.error)}</p>
          )}

          <Button
            size="lg"
            className="mt-2 w-full"
            disabled={createOrder.isPending}
            onClick={handlePlaceOrder}
          >
            {createOrder.isPending ? "Placing order..." : "Place order"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Shipping address and payment are not collected yet — this places a demo
            order against the order-fulfillment saga.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
