"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Flame, Leaf, Plus, Star, UtensilsCrossed } from "lucide-react";

import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

interface MenuCardProps {
  item: MenuItem;
  index?: number;
  /** Called when the customer taps "Add". Wired to the cart store in Phase 5. */
  onAdd?: (item: MenuItem) => void;
}

export default function MenuCard({ item, index = 0, onAdd }: MenuCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleAdd = () => {
    onAdd?.(item);
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1400);
  };

  const showImage = Boolean(item.image_url) && !imageFailed;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-night-800 shadow-card"
    >
      <motion.div
        variants={{ hover: { y: -8 } }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-night-700">
          {showImage ? (
            <motion.img
              src={item.image_url ?? undefined}
              alt={item.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
              variants={{ hover: { scale: 1.1 } }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-habibi-900/60 via-night-700 to-chili-600/30">
              <motion.div variants={{ hover: { rotate: 12, scale: 1.15 } }}>
                <UtensilsCrossed className="h-14 w-14 text-habibi-400/70" aria-hidden />
              </motion.div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-night-800 via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {item.is_featured && (
              <span className="flex items-center gap-1 rounded-full bg-ember-gradient px-3 py-1 text-xs font-semibold text-white shadow-glow">
                <Star className="h-3 w-3 fill-current" aria-hidden /> Popular
              </span>
            )}
            {item.is_vegetarian && (
              <span className="flex items-center gap-1 rounded-full bg-olive-500/90 px-3 py-1 text-xs font-semibold text-white">
                <Leaf className="h-3 w-3" aria-hidden /> Veg
              </span>
            )}
            {item.is_spicy && (
              <span className="flex items-center gap-1 rounded-full bg-chili-500/90 px-3 py-1 text-xs font-semibold text-white">
                <Flame className="h-3 w-3" aria-hidden /> Spicy
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold leading-snug">{item.name}</h3>
            <span className="shrink-0 rounded-full bg-habibi-500/15 px-3 py-1 text-sm font-bold text-habibi-300">
              {formatPrice(item.price)}
            </span>
          </div>

          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-cream-100/65">
            {item.description ?? "Made fresh to order."}
          </p>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={handleAdd}
            disabled={!item.is_available}
            aria-label={`Add ${item.name} to cart`}
            className="btn-primary mt-2 w-full"
          >
            {!item.is_available ? (
              "Sold out"
            ) : justAdded ? (
              <>
                <Check className="h-4 w-4" aria-hidden /> Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden /> Add to cart
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.article>
  );
}

