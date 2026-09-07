import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

/**
 * Guards a client-rendered page behind auth. Waits for the persisted
 * auth store to rehydrate before deciding to redirect - without this,
 * a hard page load (not a client-side nav) races the store's
 * localStorage read and bounces an already-signed-in user to /login.
 */
export function useRequireAuth(redirectTo: string) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [hasHydrated, isAuthenticated, redirectTo, router]);

  return { isReady: hasHydrated && isAuthenticated };
}
