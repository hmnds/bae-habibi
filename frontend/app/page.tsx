import { AlertTriangle, UtensilsCrossed } from "lucide-react";

import Hero from "@/components/Hero";
import MenuSection from "@/components/MenuSection";
import { fetchMenu } from "@/lib/api";
import type { Category } from "@/lib/types";

export const revalidate = 30;

async function loadMenu(): Promise<{ categories: Category[]; failed: boolean }> {
  try {
    const categories = await fetchMenu();
    return { categories, failed: false };
  } catch (error) {
    console.error("Failed to load menu from API:", error);
    return { categories: [], failed: true };
  }
}

export default async function HomePage() {
  const { categories, failed } = await loadMenu();
  const populated = categories.filter((category) => category.items.length > 0);

  return (
    <>
      <Hero />

      {failed ? (
        <section id="menu" className="container-page pt-20">
          <div className="glass mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-chili-400" aria-hidden />
            <h2 className="text-2xl font-bold">We couldn&apos;t load the menu</h2>
            <p className="text-cream-100/70">
              The kitchen is having a moment. Please refresh the page in a few seconds.
            </p>
          </div>
        </section>
      ) : populated.length === 0 ? (
        <section id="menu" className="container-page pt-20">
          <div className="glass mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl p-10 text-center">
            <UtensilsCrossed className="h-10 w-10 text-habibi-400" aria-hidden />
            <h2 className="text-2xl font-bold">Menu coming soon</h2>
            <p className="text-cream-100/70">We&apos;re getting the grill hot. Check back shortly!</p>
          </div>
        </section>
      ) : (
        <MenuSection categories={populated} />
      )}

      <section id="about" className="container-page pt-28">
        <div className="glass mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-habibi-400">Our Story</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Street food, the habibi way</h2>
          <p className="mt-5 leading-relaxed text-cream-100/70">
            Bae Habibi Wrap brings the smoky, spiced flavours of Middle Eastern street stalls to your
            table. Our meat is marinated overnight, our bread is warmed on the grill, and every sauce is
            made in-house. No shortcuts, just proper food made with love.
          </p>
        </div>
      </section>
    </>
  );
}

