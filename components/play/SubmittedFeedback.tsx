"use client";

import { motion } from "framer-motion";

export function SubmittedFeedback({ label = "¡Respuesta enviada!" }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-quantum-gradient shadow-neon-green"
      >
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-black" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <p className="font-heading text-2xl font-extrabold uppercase text-white">{label}</p>
      <p className="font-body text-white/50">Mira la pantalla gigante para el resultado…</p>
    </motion.div>
  );
}
