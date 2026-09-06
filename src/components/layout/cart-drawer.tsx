"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const setOpen = useCartStore((state) => state.setOpen);
  const items = useCartStore((state) => state.items);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Your cart is empty.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between py-4 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="border-t px-4 pt-4">
          <div className="mb-4 flex w-full items-center justify-between text-sm font-semibold">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <Button
            disabled={items.length === 0}
            className="w-full"
            nativeButton={false}
            render={
              <Link href="/checkout" onClick={() => setOpen(false)}>
                Checkout
              </Link>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
