import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORIES } from "@/features/catalog/categories";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 lg:px-8">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Everything you need, delivered fast.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Browse thousands of products across every category, with fast checkout
            and real-time order tracking.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/products">Shop now</Link>}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={{ pathname: "/products", query: { category } }}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex h-32 items-center justify-center p-4 text-center font-medium">
                  {category}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
