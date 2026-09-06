import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
  setQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    })),
  clear: () => set({ items: [] }),
}));

export const useCartCount = () =>
  useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));
