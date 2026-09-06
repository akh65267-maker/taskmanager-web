"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useOrders } from "@/features/orders/use-orders";
import type { OrderStatus } from "@/features/orders/api";

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  Pending: "secondary",
  Confirmed: "default",
  Cancelled: "destructive",
};

export default function OrdersPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const { data: orders, isLoading } = useOrders();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?redirect=/orders");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your orders</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAtUtc).toLocaleDateString()}
                    </p>
                    <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>{order.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      )}
    </div>
  );
}
