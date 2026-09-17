-- ============================================================================
-- Migración 007 — Presencia real ("conectado" = señal de vida reciente)
--
-- Antes, /admin consideraba "conectado" a cualquiera con device_id no nulo,
-- es decir: para siempre, aunque cerrara la página. Ahora /play manda un
-- "latido" (UPDATE a last_seen_at) cada ~15s mientras la pestaña sigue
-- abierta (ver lib/game/presence.ts), y /admin solo cuenta como conectado a
-- quien tenga un last_seen_at de los últimos ~35s. Si alguien cierra la
-- página, dentro de esa ventana deja de aparecer en el lobby y ya no puede
-- ser elegido por la ruleta — pero su registro NO se borra: puede volver a
-- entrar en cualquier momento (incluso a mitad de partida) y retoma su
-- identidad normalmente.
--
-- SIN esta migración, el latido queda bloqueado en silencio por RLS: las
-- policies existentes solo permitían "reclamar" (device_id null -> no null)
-- o "soltar" (no null -> null) una fila, no actualizar last_seen_at de una
-- fila que ya estaba reclamada.
-- ============================================================================

create policy "players_heartbeat" on players
  for update
  using (device_id is not null)
  with check (device_id is not null);
