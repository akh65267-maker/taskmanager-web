"use client";

import Link from "next/link";
import { ShoppingCart, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartCount, useCartStore } from "@/store/cart-store";

export function SiteHeader() {
  const cartCount = useCartCount();
  const setCartOpen = useCartStore((state) => state.setOpen);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight">
          TaskManager Shop
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/products" className="text-muted-foreground hover:text-foreground">
            All Products
          </Link>
          <Link href="/products?category=featured" className="text-muted-foreground hover:text-foreground">
            Featured
          </Link>
          <Link href="/products?sort=newest" className="text-muted-foreground hover:text-foreground">
            New Arrivals
          </Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-8" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={
              <Link href="/account">
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Link>
            }
          />

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
            <span className="sr-only">Cart</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
