"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/features/orders/use-orders";
import { useRequireAuth } from "@/features/auth/use-require-auth";
import type { OrderStatus } from "@/features/orders/api";

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  Pending: "secondary",
  Confirmed: "default",
  Cancelled: "destructive",
};

export default function OrdersPage() {
  const { isReady } = useRequireAuth("/login?redirect=/orders");
  const { data: orders, isLoading } = useOrders();

  if (!isReady) {
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
