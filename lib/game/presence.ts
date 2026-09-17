/**
 * "Conectado" ya no significa solo "alguna vez reclamó su nombre"
 * (`device_id` no nulo) — eso queda para siempre aunque cierre la pestaña.
 * Significa "mandó una señal de vida hace poco": PlayApp.tsx actualiza
 * `players.last_seen_at` cada HEARTBEAT_INTERVAL_MS mientras la página sigue
 * abierta; si alguien cierra o pierde conexión, esas señales paran solas y
 * ONLINE_THRESHOLD_MS después deja de contar como conectado — sin borrar su
 * registro, así que puede volver a entrar (a mitad de partida incluida) y
 * retoma su identidad tal cual.
 */
export const HEARTBEAT_INTERVAL_MS = 15_000;
// Un poco más del doble del intervalo de latido, para tolerar que se pierda
// un solo "tick" por mala señal sin que parpadee como desconectado.
export const ONLINE_THRESHOLD_MS = 35_000;

export function isOnline(lastSeenAt: string | null | undefined, now: number = Date.now()): boolean {
  if (!lastSeenAt) return false;
  return now - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}
