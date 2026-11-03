"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, UtensilsCrossed, X } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/useHydrated";
import { selectSubtotal, selectTotalItems, useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";

export default function Cart() {
  const hydrated = useHydrated();
  const isOpen = useUIStore((s) => s.isCartOpen);
  const closeCart = useUIStore((s) => s.closeCart);
  const lines = useCartStore((s) => s.lines);
  const totalItems = useCartStore(selectTotalItems);
  const subtotal = useCartStore(selectSubtotal);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const open = hydrated && isOpen;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeCart]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            aria-hidden
          />

          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-night-900 shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-habibi-400" aria-hidden />
                <h2 className="text-2xl font-bold">Your order</h2>
                {totalItems > 0 && (
                  <span className="rounded-full bg-habibi-500/20 px-2.5 py-0.5 text-sm font-semibold text-habibi-300">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-habibi-400 hover:text-habibi-300"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                  <UtensilsCrossed className="h-16 w-16 text-habibi-400/60" aria-hidden />
                </motion.div>
                <p className="font-display text-2xl">Your cart is empty</p>
                <p className="text-sm text-cream-100/60">Add something delicious from the menu.</p>
                <Link href="/#menu" onClick={closeCart} className="btn-primary mt-2">
                  Browse the menu
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.li
                        key={line.menuItemId}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-4 rounded-2xl border border-white/10 bg-night-800 p-3"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-night-700">
                          {line.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <UtensilsCrossed className="h-7 w-7 text-habibi-400/60" aria-hidden />
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-semibold">{line.name}</p>
                            <button
                              type="button"
                              onClick={() => removeItem(line.menuItemId)}
                              aria-label={`Remove ${line.name}`}
                              className="text-cream-100/40 transition hover:text-chili-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-white/15">
                              <button
                                type="button"
                                onClick={() => decrement(line.menuItemId)}
                                aria-label={`Decrease ${line.name} quantity`}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increment(line.menuItemId)}
                                aria-label={`Increase ${line.name} quantity`}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <span className="font-bold text-habibi-300">
                              {formatPrice(Number.parseFloat(line.price) * line.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="space-y-4 border-t border-white/10 px-6 py-5">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-cream-100/70">Subtotal</span>
                    <span className="text-2xl font-bold">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-cream-100/50">Delivery fee (if any) is added at checkout.</p>
                  <Link href="/checkout" onClick={closeCart} className="btn-primary w-full text-lg">
                    Checkout
                  </Link>
                  <button
                    type="button"
                    onClick={clear}
                    className="w-full text-center text-sm text-cream-100/50 transition hover:text-chili-400"
                  >
                    Clear cart
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

