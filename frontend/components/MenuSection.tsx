"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf, Search, SearchX } from "lucide-react";
import clsx from "clsx";

import MenuCard from "@/components/MenuCard";
import type { Category, MenuItem } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";

interface MenuSectionProps {
  categories: Category[];
}

export default function MenuSection({ categories }: MenuSectionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const onAdd = (item: MenuItem) => addItem(item);
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categories
      .filter((category) => activeSlug === "all" || category.slug === activeSlug)
      .flatMap((category) => category.items)
      .filter((item) => (vegOnly ? item.is_vegetarian : true))
      .filter((item) =>
        needle ? `${item.name} ${item.description ?? ""}`.toLowerCase().includes(needle) : true,
      );
  }, [categories, activeSlug, query, vegOnly]);

  return (
    <section id="menu" className="container-page pt-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mb-10 text-center"
      >
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-habibi-400">Our Menu</p>
        <h2 className="text-4xl font-bold sm:text-5xl">
          Taste the <span className="text-gradient">streets</span>
        </h2>
      </motion.div>

      <div className="glass sticky top-[var(--navbar-height)] z-30 -mx-4 mb-10 space-y-4 px-4 py-4 sm:mx-0 sm:rounded-3xl sm:px-6">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Menu categories">
          {[{ slug: "all", name: "All" }, ...categories].map((category) => {
            const isActive = activeSlug === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSlug(category.slug)}
                className={clsx(
                  "relative shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                  isActive ? "text-white" : "text-cream-100/70 hover:text-habibi-300",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-category"
                    className="absolute inset-0 rounded-full bg-ember-gradient shadow-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{category.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-100/40" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shawarma, burgers, falafel..."
              className="input-field pl-11"
            />
          </label>
          <button
            type="button"
            aria-pressed={vegOnly}
            onClick={() => setVegOnly((value) => !value)}
            className={clsx(
              "flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition",
              vegOnly
                ? "border-olive-400 bg-olive-500/20 text-olive-400"
                : "border-white/10 text-cream-100/70 hover:border-olive-400",
            )}
          >
            <Leaf className="h-4 w-4" aria-hidden /> Vegetarian
          </button>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, index) => (
              <MenuCard key={item.id} item={item} index={index} onAdd={onAdd} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-20 text-center text-cream-100/60"
        >
          <SearchX className="h-12 w-12 text-habibi-400/60" aria-hidden />
          <p className="text-lg font-semibold text-cream-100">Nothing matches your search</p>
          <p className="text-sm">Try a different category or clear your filters.</p>
        </motion.div>
      )}
    </section>
  );
}

