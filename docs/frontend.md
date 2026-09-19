# Frontend Architecture

Repo: `taskmanager-web` (separate from the `TaskManager` backend repo).
Verified against source on 2026-09-09. Source code is the ultimate truth — if this
document disagrees with the code, the code wins.

## Overview

| Item | Value |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4 (`src/app/globals.css`), shadcn/ui (`style: base-nova`, base color `neutral`) |
| UI primitives | `@base-ui/react` (not Radix) via shadcn components |
| Server state | TanStack React Query v5 |
| Client state | Zustand v5 (`persist`, `skipHydration`) |
| HTTP | Axios, single shared instance |
| Icons / toasts | lucide-react / sonner |
| Tests | **None.** CI (`.github/workflows/ci.yml`) runs `npm run lint` + `npm run build` only |

The app is a storefront over the backend microservices, reached through the API gateway.
Every page that touches data is a Client Component (`"use client"`); there is no server-side
data fetching, no Server Action, and no middleware.

## Application Structure

```text
src/
  app/          App Router routes (all pages, one root layout)
  components/
    layout/     SiteHeader, SiteFooter, CartDrawer
    ui/         shadcn/ui primitives
  features/     Feature slices: auth, catalog, inventory, orders
                  <feature>/api.ts        Axios calls + DTO types
                  <feature>/use-*.ts      React Query hooks
                  <feature>/*.tsx         feature-specific components
  lib/          api-client, api-error, jwt, utils
  providers/    QueryProvider, StoreHydrator
  store/        Zustand stores (auth, cart)
```

**Convention:** each feature owns `api.ts` (transport + types) and a `use-*.ts` hook module
(React Query). Components never call `apiClient` directly — they call feature hooks.

## Routing

App Router, no route groups, no nested layouts. `src/app/layout.tsx` is the only layout and
mounts `QueryProvider → StoreHydrator + SiteHeader + main + SiteFooter + CartDrawer + Toaster`.

| Route | Access | Notes |
|---|---|---|
| `/` | public | Static hero + category links (server component) |
| `/products` | public | Filters/sort/pagination driven by URL search params |
| `/products/[id]` | public | Product detail + stock, add-to-cart |
| `/login`, `/register` | public | `/login?redirect=<path>` is honored |
| `/account` | auth | Profile, sign out, admin link if Admin |
| `/orders`, `/orders/[id]` | auth (`/orders` guarded; detail **not** guarded) | |
| `/checkout` | auth | |
| `/admin/products` | auth + Admin | |

Pages that read `useSearchParams` (`/products`, `/login`) wrap their content in `<Suspense>`
— required for the App Router prerender.

Dynamic route params are typed with the Next-generated `PageProps<"/route">` /
`LayoutProps<"/">` globals and unwrapped with React `use(props.params)`.

## Authentication

Flow (all client-side):

```text
LoginPage → useLogin() → POST /users/login → { token, expiresAtUtc }
  → authStore.setSession(token, expiresAtUtc)   (persisted to localStorage "tm-auth")
  → invalidate ["currentUser"] → router.push(redirect ?? "/account")
```

- **Token storage:** `localStorage` key `tm-auth`, via Zustand `persist` (`partialize` keeps
  only `token` + `expiresAtUtc`).
- **Attachment:** an Axios request interceptor reads `useAuthStore.getState().token` and sets
  `Authorization: Bearer <token>` on every request (no allowlist — the header is sent to all
  endpoints, including public ones).
- **Expiry:** `isAuthenticated()` compares `expiresAtUtc` to `Date.now()`. There is no timer;
  expiry is only noticed on the next render or the next 401.
- **401 handling:** a response interceptor calls `authStore.logout()` and re-rejects. It does
  **not** redirect and does **not** clear the React Query cache; the user is bounced to
  `/login` only if they are on a `useRequireAuth` page (its effect fires on the state change).
- **Logout:** `useLogout()` clears the auth store and removes `["currentUser"]` queries. There
  is no server-side logout/revocation call.
- **Refresh persistence:** `persist` uses `skipHydration: true`; `StoreHydrator` (mounted in
  the root layout) rehydrates both stores in an effect and then sets `hasHydrated`. Guards wait
  on `hasHydrated` so a hard reload does not bounce a signed-in user to `/login`.
- **Current user:** `useCurrentUser()` decodes `sub` from the JWT and queries `GET /users/{id}`,
  enabled only when authenticated.

## Authorization / Roles

- Role is read **client-side from the JWT** by `src/lib/jwt.ts`, from the claim
  `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`. `isAdmin()` is true when that
  claim equals `"Admin"` and the session is unexpired. The token is decoded with `atob` — the
  signature is never verified in the browser.
- `useRequireAuth(redirectTo, { requireAdmin, forbiddenRedirectTo })` is the single guard hook.
  It returns `{ isReady }`; pages render `null` until ready. Non-admins on `/admin/products`
  are redirected to `/`.
- **This is UI convenience, not a security boundary.** Nothing stops a client from rendering
  admin UI or issuing admin requests; enforcement is the backend's (`Admin` policy on the
  catalog/inventory write endpoints — see the backend `docs/authentication.md`).

## API Client

`src/lib/api-client.ts` exports a single Axios instance.

| Concern | Implementation |
|---|---|
| Base URL | `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"` (the API gateway) |
| Auth header | Request interceptor, Bearer from the auth store |
| 401 | Response interceptor → `logout()`, error re-thrown |
| Other statuses | Not intercepted; handled per-call by React Query |
| Error messages | `getApiErrorMessage(error, fallback)` reads ProblemDetails `detail` then `title` |

All calls are centralized in `features/*/api.ts`. Backend paths used, matching the gateway
route prefixes: `/users`, `/products`, `/inventory`, `/orders`. (`/tasks` and `/basket` exist on
the gateway but the frontend calls neither.)

`getInventory` is the one place that swallows a status: 404 → `null` (product with no
inventory record).

## React Query

- One `QueryClient`, created lazily in state inside `QueryProvider` ("use client").
- Defaults: `staleTime: 60_000`, `retry: 1`. No persistence, no devtools, no SSR hydration.

| Key | Source | Notes |
|---|---|---|
| `["products", params]` | `useProducts` | `placeholderData: keepPrevious` for filter/page changes |
| `["product", id]` | `useProduct` | `enabled: Boolean(id)` |
| `["inventory"]` | `useInventoryList` | admin list |
| `["inventory", productId]` | `useInventory` | |
| `["orders"]` | `useOrders` | |
| `["order", id]` | `useOrder` | **polls every 1500 ms while status is `Pending`**, then stops — this is how the async fulfillment saga's result reaches the UI |
| `["currentUser", userId]` | `useCurrentUser` | |

Mutations invalidate rather than optimistically update: create product → `["products"]`;
create/restock inventory → `["inventory"]` and `["inventory", productId]`; create order →
`["orders"]`. No optimistic updates anywhere.

Note the key overlap: `["inventory"]` is both the list key and a prefix of `["inventory", id]`,
so invalidating the list also invalidates every per-product query. Intentional or not, that is
the current behavior.

## Zustand

| Store | Persisted (`localStorage`) | Responsibility |
|---|---|---|
| `auth-store` (`tm-auth`) | `token`, `expiresAtUtc` | Session token, expiry check, `isAdmin()` derived from the JWT, `hasHydrated` flag |
| `cart-store` (`tm-cart`) | `items` | Cart lines (`productId`, `name`, `price`, `quantity`), drawer `isOpen` (not persisted) |

Both use `skipHydration: true` and are rehydrated by `StoreHydrator`.

`useCartCount()` / `useCartSubtotal()` are selector hooks exported alongside the cart store —
the pattern for derived cart values.

**The cart is purely client-side.** The backend `BasketService` is never called; cart contents
exist only in the browser and are sent to `POST /orders` at checkout, including the client's
own `unitPrice`.

## Product / Catalog

```text
/products page (URL search params = filter state)
  → useProducts({category,minPrice,maxPrice,search,sort,page,pageSize:12})
  → GET /products?…  → { items, totalCount, page, pageSize }
  → grid of ProductCard | skeletons | "No products match your filters."
```

- Filter state lives in the URL, not in a store; `updateParams` rewrites the query string with
  `router.push` and resets `page` unless `page` is the field being changed.
- Sort options: `newest | price-asc | price-desc | name`. Price slider range is `0–200`
  (`MAX_PRICE`); values at the bounds are omitted from the request.
- Categories are a hardcoded frontend constant (`src/features/catalog/categories.ts`), not
  fetched from the backend.
- Detail page combines `useProduct(id)` and `useInventory(id)`; add-to-cart is disabled while
  inventory loads or when `quantityAvailable === 0`.
- Checkout: `POST /orders` with the cart lines → clear cart → `router.push(/orders/{id})`,
  where the polling `useOrder` shows `Pending → Confirmed | Cancelled` and renders
  `cancellationReason` on cancellation.

## Admin Panel

- No admin layout or nav; a single page `/admin/products`, linked from `/account` only when
  `isAdmin()`.
- Guarded by `useRequireAuth("/login?redirect=/admin/products", { requireAdmin: true })`.
- Lists `useProducts({ pageSize: 100 })` joined against `useInventoryList()` via a
  `Map<productId, quantityAvailable>`.
- **New product** is a two-step client-orchestrated flow: `POST /products`, then on success
  `POST /inventory` with the initial stock. If the second call fails, the product exists with
  no inventory record — there is no rollback.
- **Restock** calls `POST /inventory/{id}/restock`; on a 404 it falls back to `POST /inventory`
  (creating the record), which is how products created without stock are handled.

## UI Architecture

- shadcn/ui components in `src/components/ui`, built on `@base-ui/react`. Base UI's composition
  prop is `render` (not Radix `asChild`): `<Button nativeButton={false} render={<Link …/>} />`,
  `<DialogTrigger render={<Button…/>} />`. Follow this when adding components.
- Variants via `class-variance-authority`; `cn` is re-exported from the `cn` package through
  `src/lib/utils.ts` (not the usual local `clsx + tailwind-merge` helper).
- Icons: `lucide-react`. Toasts: `sonner`, mounted once as `<Toaster />` in the root layout.
- `next-themes` is a dependency but **only** `components/ui/sonner.tsx` uses `useTheme`. No
  `ThemeProvider` is mounted and there is no theme toggle, so `theme` always falls back to
  `"system"`. Dark-mode Tailwind classes exist in places (e.g. product stock text).
- `src/components/ui/toast.tsx` exists but nothing imports it; sonner is the notification path.
- Responsive pattern: `max-w-7xl` (catalog) / `max-w-2xl` (forms, orders) containers with
  `px-4 sm:px-6 lg:px-8`, Tailwind breakpoint utilities. Header nav and search hide below
  `md`/`sm`.

## Error Handling

| Case | Behavior |
|---|---|
| Loading | `Skeleton` components; list pages show skeleton grids, `/products` dims the grid at `opacity: 0.6` while `isFetching` |
| Empty | Inline muted text ("No products match your filters.", "Your cart is empty.", "You haven't placed any orders yet.") |
| 401 | Interceptor logs out; guarded pages then redirect to `/login` |
| 403 | No specific handling — a non-admin who reaches an admin call sees the generic error message |
| 404 | Product detail renders "Product not found." on `isError`; `getInventory` maps 404 → `null`; restock maps 404 → create |
| Mutation errors | **Two conventions coexist:** inline `<p className="text-destructive">` from `getApiErrorMessage` (login, register, checkout, new-product dialog) and `toast.error(...)` (restock). Successes on admin/cart actions use `toast.success`. |
| Network failure | No dedicated handling; surfaces as the generic fallback message |
| Validation | Native HTML form validation only (`required`, `type="email"`, `minLength={8}`, `min`/`step`). No schema validation library. |

There is no React error boundary, no `error.tsx`, and no `not-found.tsx`.

## Environment Configuration

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | API gateway base URL | `http://localhost:8000` |

`.env.local.example` documents it. `next.config.ts` is empty (defaults). Because the variable is
`NEXT_PUBLIC_*`, it is inlined at build time — a container image must be rebuilt to point at a
different gateway. No Dockerfile exists in this repo.

## Important Conventions

1. Components call feature hooks; only `features/*/api.ts` imports `apiClient`.
2. DTO types live next to the call that returns them, in `features/*/api.ts`.
3. Auth token is read from the store *inside* the interceptor (`getState()`), never passed in.
4. Guard client pages with `useRequireAuth` and render `null` until `isReady` — never redirect
   before `hasHydrated`.
5. Mutations invalidate query keys in `onSuccess`; no manual cache writes.
6. URL search params are the source of truth for catalog filter/sort/page state.
7. Base UI composition uses `render={...}`, not `asChild`.
8. Error copy comes from `getApiErrorMessage`, never from `error.message`.

## Known Issues / Uncertainties

- **No tests of any kind.** CI proves only that the app lints and builds; nothing verifies API
  integration. Every behavior above is read from source, not from test evidence.
- `/orders/[id]` is **not** guarded by `useRequireAuth`, unlike `/orders` and `/checkout`. An
  unauthenticated visitor gets an un-redirected page whose request 401s (backend still enforces).
- Order pricing is client-supplied: checkout sends `unitPrice` from the local cart.
  Whether `OrderService` re-validates price against the catalog is **not verified here** — see
  the backend docs.
- Prices are formatted with `toFixed(2)` and a hardcoded `$`; there is no currency/locale
  handling.
- Inconsistent mutation-error surface (inline text vs. toast) — recorded, not standardized.
- The 401 interceptor logs out but leaves the React Query cache populated; stale
  authenticated data can remain rendered until the component unmounts or refetches.
- `next-themes` and `components/ui/toast.tsx` are effectively dead weight (see UI Architecture).
- `admin` product creation has no rollback if the follow-up inventory call fails.
- Product **editing/deletion** does not exist in the frontend — only create and restock.
- Whether the gateway's `/products/{**catch-all}` route matches the bare `GET /products` the
  catalog page issues is **Unknown / Requires Verification** from the frontend side (the app
  assumes it does).
