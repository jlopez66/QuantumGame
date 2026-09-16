-- ============================================================================
-- Migración 005 — Configuración definitiva del Juego 1
-- Agrega la Ronda 0 (calentamiento sin puntos) del Juego 1: "Más/Menos" +
-- "Más/Menos" + "Opción Múltiple" (puzzle) + "Cifra Exacta". El contenido de
-- las preguntas vive en código (lib/game/rounds-data.ts y lib/game/answers.ts)
-- — esta migración SOLO amplía los checks de la base de datos para permitir
-- la Ronda 0. No borra equipos, jugadores, respuestas ni puntajes.
-- ============================================================================

alter table game_state drop constraint if exists game_state_current_round_check;
alter table game_state add constraint game_state_current_round_check
  check (current_round between 0 and 3);

alter table responses drop constraint if exists responses_round_number_check;
alter table responses add constraint responses_round_number_check
  check (round_number between 0 and 3);

-- ----------------------------------------------------------------------------
-- Nada más que migrar: el resto del Juego 1 (preguntas, opciones, puntos,
-- respuestas correctas, fun facts) se lee de código en cada request, no de
-- la base de datos. Solo asegúrate de subir las imágenes referenciadas en
-- lib/game/rounds-data.ts a public/products/:
--   ST29.webp, TB33.webp, ST23.webp, ST27.webp, TB34.webp (ver public/products/README.md)
-- ============================================================================
