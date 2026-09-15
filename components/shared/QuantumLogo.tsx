import clsx from "clsx";

export function QuantumLogo({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center gap-2 font-heading font-extrabold uppercase", className)}>
      <span className="text-quantum-gradient">Quantum</span>
      <span className="rounded-full border border-white/20 px-2 py-0.5 text-[0.6em] font-bold tracking-widest text-white/50">
        Brandex
      </span>
    </div>
  );
}
