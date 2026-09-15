"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/game/departments";
import { getAvatarUrl } from "@/lib/game/avatar";
import { getDeviceId } from "@/lib/game/device";
import { DepartmentGrid } from "./DepartmentGrid";
import type { PlayerRow, TeamRow } from "@/lib/supabase/types";

interface Props {
  onRegistered: (player: PlayerRow, team: TeamRow) => void;
}

export function RegistrationFlow({ onRegistered }: Props) {
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [roster, setRoster] = useState<PlayerRow[] | null>(null);
  const [showSelfRegister, setShowSelfRegister] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectDepartment = async (slug: string) => {
    setError(null);
    const { data: teamRow } = await supabase.from("teams").select("*").eq("slug", slug).single();
    if (!teamRow) {
      setError("No se pudo encontrar el departamento. Intenta de nuevo.");
      return;
    }
    setTeam(teamRow);
    setShowSelfRegister(false);

    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamRow.id)
      .order("name", { ascending: true });
    setRoster(players ?? []);
  };

  const reloadRoster = async () => {
    if (!team) return;
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", team.id)
      .order("name", { ascending: true });
    setRoster(players ?? []);
  };

  const claim = async (candidate: PlayerRow) => {
    if (!team || busy) return;
    setBusy(true);
    setError(null);

    const deviceId = getDeviceId();
    const { data: claimed, error: claimError } = await supabase
      .from("players")
      .update({ device_id: deviceId })
      .eq("id", candidate.id)
      .is("device_id", null)
      .select()
      .single();

    if (claimError || !claimed) {
      setError("Alguien más acaba de tomar ese nombre. Elige otro de la lista.");
      await reloadRoster();
      setBusy(false);
      return;
    }

    onRegistered(claimed, team);
  };

  const selfRegister = async () => {
    if (!team || !name.trim() || busy) return;
    setBusy(true);
    setError(null);

    const trimmed = name.trim().slice(0, 24);
    const deviceId = getDeviceId();
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        team_id: team.id,
        department_slug: team.slug,
        name: trimmed,
        avatar_url: getAvatarUrl(trimmed),
        device_id: deviceId,
      })
      .select()
      .single();

    if (playerError || !player) {
      setError("No se pudo unir a la partida. Intenta de nuevo.");
      setBusy(false);
      return;
    }

    onRegistered(player, team);
  };

  if (!team) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-10">
        <Header />
        <div className="w-full max-w-sm space-y-3">
          <p className="text-center font-body text-sm text-white/60">Elige tu departamento</p>
          <DepartmentGrid selected={null} onSelect={selectDepartment} />
        </div>
        {error && <p className="text-center font-body text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  const dept = DEPARTMENTS.find((d) => d.slug === team.slug);
  const unclaimed = (roster ?? []).filter((p) => !p.device_id);
  const claimedCount = (roster ?? []).length - unclaimed.length;

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-10">
      <Header />

      <div className="w-full max-w-sm space-y-1 text-center">
        <p className="font-body text-xs uppercase tracking-widest text-white/40">Departamento</p>
        <p className="font-heading text-xl font-extrabold" style={{ color: dept?.color }}>
          {team.name}
        </p>
        <button onClick={() => setTeam(null)} className="font-body text-xs text-white/40 underline">
          Cambiar departamento
        </button>
      </div>

      {roster === null ? (
        <p className="font-body text-white/40">Cargando lista…</p>
      ) : (
        <div className="w-full max-w-sm space-y-3">
          {unclaimed.length > 0 && (
            <>
              <p className="text-center font-body text-sm text-white/60">Toca tu nombre en la lista</p>
              <div className="max-h-64 space-y-2 overflow-y-auto no-scrollbar">
                {unclaimed.map((p) => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.97 }}
                    disabled={busy}
                    onClick={() => claim(p)}
                    className="card-quantum flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getAvatarUrl(p.name, p.avatar_url)} alt="" className="h-9 w-9 shrink-0 rounded-full" />
                    <span className="font-body text-white/90">{p.name}</span>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {claimedCount > 0 && (
            <p className="text-center font-body text-xs text-white/30">{claimedCount} personas de tu mesa ya entraron</p>
          )}

          {!showSelfRegister && (
            <button
              onClick={() => setShowSelfRegister(true)}
              className="w-full rounded-2xl border border-white/15 py-3 font-body text-sm text-white/50 transition hover:border-brand-cyan/50 hover:text-white"
            >
              No estoy en la lista / Registrarme
            </button>
          )}

          {showSelfRegister && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                maxLength={24}
                className="w-full rounded-2xl border border-white/15 bg-brand-dark px-5 py-4 font-body text-white placeholder-white/30 outline-none focus:border-brand-cyan"
              />
              <button
                disabled={!name.trim() || busy}
                onClick={selfRegister}
                className="btn-quantum w-full py-4 text-lg shadow-neon-cyan"
              >
                {busy ? "Uniéndote…" : "Entrar al juego"}
              </button>
            </motion.div>
          )}

          {error && <p className="text-center font-body text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
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
