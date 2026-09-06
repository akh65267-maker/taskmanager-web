import { useQuery } from "@tanstack/react-query";
import { getInventory } from "./api";

export function useInventory(productId: string) {
  return useQuery({
    queryKey: ["inventory", productId],
    queryFn: () => getInventory(productId),
    enabled: Boolean(productId),
  });
}
