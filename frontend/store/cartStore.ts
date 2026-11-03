import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { MenuItem } from "@/lib/types";

export const MAX_QUANTITY_PER_ITEM = 50;

export interface CartLine {
  menuItemId: number;
  name: string;
  /** Unit price as a decimal string, exactly as returned by the API. */
  price: string;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  addItem: (item: MenuItem, quantity?: number) => void;
  increment: (menuItemId: number) => void;
  decrement: (menuItemId: number) => void;
  removeItem: (menuItemId: number) => void;
  clear: () => void;
}

const clampQuantity = (value: number): number => Math.min(MAX_QUANTITY_PER_ITEM, Math.max(0, Math.floor(value)));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((line) => line.menuItemId === item.id);
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.menuItemId === item.id
                  ? { ...line, quantity: clampQuantity(line.quantity + quantity), price: item.price }
                  : line,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                imageUrl: item.image_url,
                quantity: clampQuantity(quantity),
              },
            ],
          };
        }),

      increment: (menuItemId) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.menuItemId === menuItemId ? { ...line, quantity: clampQuantity(line.quantity + 1) } : line,
          ),
        })),

      decrement: (menuItemId) =>
        set((state) => ({
          lines: state.lines
            .map((line) => (line.menuItemId === menuItemId ? { ...line, quantity: line.quantity - 1 } : line))
            .filter((line) => line.quantity > 0),
        })),

      removeItem: (menuItemId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.menuItemId !== menuItemId) })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: "bae-habibi-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const selectTotalItems = (state: CartState): number =>
  state.lines.reduce((sum, line) => sum + line.quantity, 0);

/** Subtotal in pence to avoid floating point drift, returned in pounds. */
export const selectSubtotal = (state: CartState): number =>
  state.lines.reduce((sum, line) => sum + Math.round(Number.parseFloat(line.price) * 100) * line.quantity, 0) / 100;

