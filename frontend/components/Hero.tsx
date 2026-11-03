"use client";

import { motion } from "framer-motion";
import { ArrowDown, Clock, Flame, MapPin } from "lucide-react";

const STATS = [
  { icon: Flame, label: "Cooked fresh", value: "Every order" },
  { icon: Clock, label: "Ready in", value: "15-20 min" },
  { icon: MapPin, label: "Takeaway", value: "& delivery" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const rise = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-24 top-10 h-96 w-96 animate-float rounded-full bg-habibi-500/20 blur-3xl" />
        <div
          className="absolute -left-24 bottom-0 h-96 w-96 animate-float rounded-full bg-chili-500/20 blur-3xl"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container-page flex min-h-[calc(100dvh-var(--navbar-height))] flex-col items-center justify-center py-16 text-center">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl">
          <motion.p
            variants={rise}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-habibi-400/30 bg-habibi-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-habibi-300"
          >
            <Flame className="h-4 w-4" aria-hidden /> Middle Eastern Street Food
          </motion.p>

          <motion.h1 variants={rise} className="text-5xl font-bold leading-[1.05] sm:text-7xl lg:text-8xl">
            Wrapped with <span className="text-gradient">love.</span>
            <br />
            Loaded with <span className="text-gradient">flavour.</span>
          </motion.h1>

          <motion.p
            variants={rise}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream-100/70 sm:text-xl"
          >
            Slow-roasted shawarma, crispy falafel and juicy burgers, stacked high and made fresh to order.
            Pick it up or get it delivered, habibi.
          </motion.p>

          <motion.div variants={rise} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.a href="#menu" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary text-lg">
              Order now
            </motion.a>
            <motion.a href="#about" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-ghost text-lg">
              Our story
            </motion.a>
          </motion.div>

          <motion.ul variants={rise} className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STATS.map(({ icon: Icon, label, value }) => (
              <li key={label} className="glass flex items-center gap-4 rounded-2xl px-5 py-4 text-left">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ember-gradient">
                  <Icon className="h-5 w-5 text-white" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-widest text-cream-100/50">{label}</span>
                  <span className="block font-semibold">{value}</span>
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.a
          href="#menu"
          aria-label="Scroll to menu"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="mt-12 text-habibi-400"
        >
          <ArrowDown className="h-7 w-7" />
        </motion.a>
      </div>
    </section>
  );
}

