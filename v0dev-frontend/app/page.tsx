"use client";

import { motion } from "framer-motion";

import { ModeCard } from "@/components/ModeCard";
import { modeCards } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col"
      >
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xl font-semibold tracking-[0.24em] text-white">
              v0dev
            </p>
            <p className="text-sm text-[var(--muted)]">AI Website Builder</p>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-white md:text-7xl">
              Describe it. Record it. Build it.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)] md:text-xl">
              Turn your ideas into production-ready websites using AI — three ways
              to get started.
            </p>
          </div>

          <div className="mt-14 grid w-full max-w-6xl gap-6 md:grid-cols-3">
            {modeCards.map((card, index) => (
              <ModeCard key={card.mode} card={card} index={index} />
            ))}
          </div>
        </section>
      </motion.div>
    </main>
  );
}
