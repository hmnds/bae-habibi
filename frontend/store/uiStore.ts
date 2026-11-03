import { create } from "zustand";

interface UIState {
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  isMobileMenuOpen: false,
  openCart: () => set({ isCartOpen: true, isMobileMenuOpen: false }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen, isMobileMenuOpen: false })),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
}));

