"use client";

import { use } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/features/orders/use-orders";
import { useRequireAuth } from "@/features/auth/use-require-auth";

const STATUS_CONFIG = {
  Pending: { label: "Processing", icon: Clock, variant: "secondary" as const },
  Confirmed: { label: "Confirmed", icon: CheckCircle2, variant: "default" as const },
  Cancelled: { label: "Cancelled", icon: XCircle, variant: "destructive" as const },
};

export default function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  const { id } = use(props.params);
  const { isReady } = useRequireAuth("/login");
  const { data: order, isLoading } = useOrder(id);

  if (!isReady || isLoading || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.Pending;
  const StatusIcon = status.icon;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Order confirmation</CardTitle>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>

          {order.status === "Pending" && (
            <p className="text-sm text-muted-foreground">
              We&apos;re reserving your items and confirming this order — this page
              updates automatically.
            </p>
          )}

          {order.status === "Cancelled" && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {order.cancellationReason ?? "This order could not be fulfilled."}
            </p>
          )}

          <ul className="flex flex-col divide-y">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between py-3 text-sm">
                <span>Qty {item.quantity}</span>
                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <Separator />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>

          <Button
            variant="outline"
            className="mt-2 w-fit"
            nativeButton={false}
            render={<Link href="/orders">View all orders</Link>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
