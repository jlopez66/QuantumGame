"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { DEPARTMENTS, type Department } from "@/lib/game/departments";
import { getAvatarUrl } from "@/lib/game/avatar";
import { getDeviceId } from "@/lib/game/device";
import type { PlayerRow, TeamRow } from "@/lib/supabase/types";

interface Props {
  onRegistered: (player: PlayerRow, team: TeamRow) => void;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function buzz(ms: number) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

export function RegistrationFlow({ onRegistered }: Props) {
  const [teams, setTeams] = useState<TeamRow[] | null>(null);
  const [players, setPlayers] = useState<PlayerRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [teamsRes, playersRes] = await Promise.all([
        supabase.from("teams").select("*"),
        supabase.from("players").select("*").order("name", { ascending: true }),
      ]);
      if (cancelled) return;
      if (teamsRes.data) setTeams(teamsRes.data);
      if (playersRes.data) setPlayers(playersRes.data);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Bloquea el scroll de fondo mientras el retrato de confirmación está abierto,
  // pero sin tocar el scrollTop: al cerrar, el muro queda justo donde lo dejaste.
  useEffect(() => {
    document.body.style.overflow = selectedPlayer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPlayer]);

  const teamsById = useMemo(() => new Map((teams ?? []).map((t) => [t.id, t])), [teams]);

  const reloadRoster = async () => {
    const { data } = await supabase.from("players").select("*").order("name", { ascending: true });
    setPlayers(data ?? []);
  };

  const openReveal = (candidate: PlayerRow) => {
    buzz(10);
    setSelectedPlayer(candidate);
  };

  const confirmSelection = async () => {
    if (busy || !selectedPlayer) return;
    const team = teamsById.get(selectedPlayer.team_id);
    if (!team) {
      setError("No se pudo encontrar el departamento de esta persona. Intenta de nuevo.");
      return;
    }

    buzz(25);
    setBusy(true);
    setError(null);

    const deviceId = getDeviceId();
    const { data: claimed, error: claimError } = await supabase
      .from("players")
      .update({ device_id: deviceId })
      .eq("id", selectedPlayer.id)
      .is("device_id", null)
      .select()
      .single();

    if (claimError || !claimed) {
      setError("Alguien más acaba de tomar ese lugar. Elige a otra persona.");
      setSelectedPlayer(null);
      await reloadRoster();
      setBusy(false);
      return;
    }

    onRegistered(claimed, team);
  };

  const unclaimed = (players ?? []).filter((p) => !p.device_id);
  const claimedCount = (players ?? []).length - unclaimed.length;

  const normalizedSearch = normalize(search.trim());
  const filtered = unclaimed.filter((p) => {
    if (activeDept && p.department_slug !== activeDept) return false;
    if (normalizedSearch && !normalize(p.name).includes(normalizedSearch)) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-4 py-8">
      <Header />

      {players === null ? (
        <p className="font-body text-white/40">Cargando roster…</p>
      ) : (
        <div className="w-full max-w-5xl space-y-4">
          <p className="text-center font-body text-sm text-white/60">Mira a todo el equipo y elige tu personaje</p>

          <div className="relative w-full max-w-md mx-auto">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar agente…"
              className="w-full rounded-2xl border border-white/15 bg-brand-dark px-10 py-3 font-body text-white placeholder-white/30 outline-none transition focus:border-brand-cyan focus:shadow-neon-cyan"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1">
            <DeptChip label="Todos" color="#00F2FE" active={activeDept === null} onClick={() => setActiveDept(null)} />
            {DEPARTMENTS.map((dept) => (
              <DeptChip
                key={dept.slug}
                label={dept.name}
                color={dept.color}
                active={activeDept === dept.slug}
                onClick={() => setActiveDept(dept.slug)}
              />
            ))}
          </div>

          {filtered.length > 0 && (
            <div className="grid grid-cols-3 gap-3 py-2 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
              {filtered.map((p) => {
                const dept = DEPARTMENTS.find((d) => d.slug === p.department_slug);
                const color = dept?.color ?? "#00F2FE";
                return (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    disabled={busy}
                    onClick={() => openReveal(p)}
                    className="card-quantum group flex flex-col items-center gap-1.5 border-2 border-white/10 p-1.5 transition-colors duration-150 hover:border-brand-cyan hover:shadow-neon-cyan disabled:opacity-40 sm:gap-2 sm:p-2"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarUrl(p.name, p.avatar_url)}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getAvatarUrl(p.name);
                        }}
                      />
                      {dept && (
                        <span
                          className="absolute right-1 top-1 rounded-full border px-1.5 py-0.5 font-heading text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
                          style={{ borderColor: color, color, backgroundColor: "rgba(0,0,0,0.65)" }}
                        >
                          {dept.slug.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-2 text-center font-heading text-[11px] font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-xs">
                      {p.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {unclaimed.length === 0 ? (
            <p className="text-center font-body text-sm text-white/40">Todos ya entraron al juego.</p>
          ) : (
            <>
              {filtered.length === 0 && (
                <p className="text-center font-body text-sm text-white/40">No encontramos a nadie con ese filtro.</p>
              )}
              {claimedCount > 0 && (
                <p className="text-center font-body text-xs text-white/30">
                  {claimedCount} de {(players ?? []).length} ya entraron
                </p>
              )}
            </>
          )}

          {error && <p className="text-center font-body text-sm text-red-400">{error}</p>}
        </div>
      )}

      <AnimatePresence>
        {selectedPlayer && (
          <EpicReveal
            player={selectedPlayer}
            dept={DEPARTMENTS.find((d) => d.slug === selectedPlayer.department_slug)}
            busy={busy}
            onCancel={() => setSelectedPlayer(null)}
            onConfirm={confirmSelection}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EpicReveal({
  player,
  dept,
  busy,
  onCancel,
  onConfirm,
}: {
  player: PlayerRow;
  dept?: Department;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const color = dept?.color ?? "#00F2FE";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/95 px-6"
    >
      {/* Flash de cámara al entrar */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-white"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      {/* Rayos de luz rotando, color del departamento. El contenedor cubre
          TODA la pantalla (inset-0) y la máscara usa "farthest-corner", que
          se auto-ajusta a cualquier proporción de pantalla (celular angosto
          o PC ancho) para que el desvanecido siempre llegue exacto a la
          esquina visible — nunca se nota dónde "termina" el círculo. */}
      <motion.div
        className="pointer-events-none absolute inset-0 blur-3xl"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${color}4D 10deg, transparent 24deg, transparent 66deg, ${color}33 76deg, transparent 90deg, transparent 156deg, ${color}4D 166deg, transparent 180deg, transparent 246deg, ${color}33 256deg, transparent 270deg, transparent 336deg, ${color}4D 346deg, transparent 360deg)`,
          maskImage: "radial-gradient(circle farthest-corner at center, white 0%, white 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(circle farthest-corner at center, white 0%, white 30%, transparent 100%)",
        }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 1 }}
        transition={{ rotate: { duration: 24, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.5 } }}
      />

      {/* Barra diagonal estilo pantalla VS, difuminada para que no se vea como
          un rectángulo cortado sino como un haz de luz suave. */}
      <div
        className="pointer-events-none absolute inset-x-[-10%] top-1/2 h-20 -translate-y-1/2 -rotate-6 blur-2xl sm:h-28"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          maskImage: "linear-gradient(90deg, transparent, white 30%, white 70%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, white 30%, white 70%, transparent)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative aspect-square w-56 overflow-hidden rounded-3xl border-4 sm:w-72"
          style={{ borderColor: color, boxShadow: `0 0 50px ${color}, 0 0 110px ${color}55` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAvatarUrl(player.name, player.avatar_url)}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getAvatarUrl(player.name);
            }}
          />
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="space-y-1 text-center"
        >
          {dept && (
            <p className="font-body text-xs font-bold uppercase tracking-[0.3em]" style={{ color }}>
              {dept.name}
            </p>
          )}
          <h2 className="font-heading text-3xl font-extrabold italic text-white sm:text-4xl">{player.name}</h2>
        </motion.div>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.25 }}
          className="flex w-full max-w-xs gap-3"
        >
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-2xl border border-white/15 py-3 font-body text-sm text-white/60 transition hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            Elegir otro
          </button>
          <button onClick={onConfirm} disabled={busy} className="btn-quantum flex-1 py-3 text-sm shadow-neon-cyan">
            {busy ? "Entrando…" : "Confirmar"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DeptChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-wide transition-colors"
      style={{
        borderColor: active ? color : "rgba(255,255,255,0.15)",
        color: active ? color : "rgba(255,255,255,0.5)",
        backgroundColor: active ? `${color}1A` : "transparent",
        boxShadow: active ? `0 0 12px ${color}55` : undefined,
      }}
    >
      {label}
    </button>
  );
}

function Header() {
  return (
    <div className="text-center">
      <p className="font-heading text-xs font-bold uppercase tracking-[0.4em] text-brand-cyan">Brandex</p>
      <h1 className="text-quantum-gradient font-heading text-5xl font-extrabold uppercase">Quantum</h1>
    </div>
  );
}
