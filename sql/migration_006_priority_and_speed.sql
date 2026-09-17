-- ============================================================================
-- Migración 006 — Prioridad en la ruleta + bono de velocidad
-- 1. Agrega players.times_represented: cuántas veces ya salió esa persona
--    como representante. La ruleta prioriza a quien tenga el número más bajo
--    (puede repetir a alguien si ya todos en su mesa han salido al menos una
--    vez, pero nunca antes de agotar a los demás).
-- 2. No requiere nada más en la base de datos: el bono de velocidad para
--    desempatar respuestas correctas y la opción de "repetir pregunta" se
--    calculan en el código (lib/game/scoring.ts y app/api/admin-action) a
--    partir de columnas que ya existen (responses.created_at, game_state).
-- ============================================================================

alter table players add column if not exists times_represented int not null default 0;
