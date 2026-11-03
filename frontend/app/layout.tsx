import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";

import Cart from "@/components/Cart";
import Navbar from "@/components/Navbar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bae Habibi Wrap | Middle Eastern Street Food",
    template: "%s | Bae Habibi Wrap",
  },
  description:
    "Fresh shawarmas, loaded wraps and juicy burgers - authentic Middle Eastern street food, made to order for takeaway.",
  keywords: ["shawarma", "wraps", "burgers", "Middle Eastern", "takeaway", "street food"],
  openGraph: {
    title: "Bae Habibi Wrap",
    description: "Authentic Middle Eastern street food, made to order.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="min-h-screen">
        <Navbar />
        <Cart />
        <main className="pt-[var(--navbar-height)]">{children}</main>
        <footer id="contact" className="mt-24 border-t border-white/10 bg-night-900">
          <div className="container-page flex flex-col items-center justify-between gap-4 py-10 text-sm text-cream-100/60 sm:flex-row">
            <p className="font-display text-lg text-cream-100">
              Bae Habibi <span className="text-gradient">Wrap</span>
            </p>
            <p>&copy; {new Date().getFullYear()} Bae Habibi Wrap. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

