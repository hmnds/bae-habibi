"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Menu, ShoppingBag, X } from "lucide-react";
import clsx from "clsx";

import { useHydrated } from "@/lib/useHydrated";
import { selectTotalItems, useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/#menu" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const storedCount = useCartStore(selectTotalItems);
  const cartCount = hydrated ? storedCount : 0;
  const [scrolled, setScrolled] = useState(false);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);
  const toggleCart = useUIStore((s) => s.toggleCart);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled || isMobileMenuOpen ? "glass shadow-card" : "bg-transparent",
      )}
    >
      <nav
        aria-label="Main navigation"
        className="container-page flex h-[var(--navbar-height)] items-center justify-between"
      >
        <Link href="/" className="group flex items-center gap-2" aria-label="Bae Habibi Wrap home">
          <motion.span
            whileHover={{ rotate: -12, scale: 1.1 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ember-gradient shadow-glow"
          >
            <Flame className="h-5 w-5 text-white" aria-hidden />
          </motion.span>
          <span className="font-display text-xl font-bold leading-none sm:text-2xl">
            Bae Habibi <span className="text-gradient">Wrap</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group relative py-2 text-sm font-medium uppercase tracking-widest text-cream-100/80 transition hover:text-habibi-300"
              >
                {link.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-ember-gradient transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={toggleCart}
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition hover:border-habibi-400 hover:text-habibi-300"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-chili-500 px-1 text-xs font-bold text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "calc(100dvh - var(--navbar-height))", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden md:hidden"
          >
            <ul className="container-page flex flex-col gap-2 pt-6">
              {NAV_LINKS.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ x: -24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.08 * index + 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="block rounded-2xl px-4 py-4 font-display text-3xl transition hover:bg-white/5 hover:text-habibi-300"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

