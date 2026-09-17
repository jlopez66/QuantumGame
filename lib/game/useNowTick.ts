"use client";

import { useEffect, useState } from "react";

/**
 * Fuerza un re-render cada `intervalMs` devolviendo la hora actual. Se usa
 * junto con lib/game/presence.ts para que un jugador "expire" visualmente de
 * la lista de conectados cuando deja de mandar señal de vida, aunque no
 * llegue ningún evento nuevo de Realtime que dispare un re-render por su cuenta.
 */
export function useNowTick(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
