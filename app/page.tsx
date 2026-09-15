import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-black px-6 text-center">
      <div className="space-y-3">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.4em] text-brand-cyan">
          Brandex presenta
        </p>
        <h1 className="text-quantum-gradient font-heading text-6xl font-extrabold uppercase sm:text-8xl">
          Quantum
        </h1>
        <p className="font-body text-white/60">Sistema operativo interno — Evento de lanzamiento</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/admin"
          className="btn-quantum px-8 py-4 text-lg shadow-neon-cyan"
        >
          Panel TV /admin
        </Link>
        <Link
          href="/play"
          className="card-quantum glow-border px-8 py-4 font-heading text-lg font-bold uppercase text-white transition hover:bg-white/5"
        >
          Jugar /play
        </Link>
      </div>
    </main>
  );
}
