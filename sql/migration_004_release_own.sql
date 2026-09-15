-- ============================================================================
-- Migración 004 — Permite "Cambiar de usuario" en /play.
-- Ejecutar en el SQL Editor de Supabase sobre un proyecto que ya corrió
-- sql/schema.sql, sql/migration_002_roulette.sql y
-- sql/migration_003_remove_self_register.sql.
--
-- Hasta ahora players_claim_unclaimed solo permitía pasar de
-- device_id null -> not null (reclamar), nunca al revés. Si alguien tocaba
-- el nombre equivocado no había forma de soltarlo. Esta policy agrega el
-- camino inverso (not null -> null) para que /play pueda ofrecer un botón
-- "Cambiar de usuario".
--
-- Mismo modelo de confianza que el resto de este esquema (ver comentario en
-- sql/schema.sql, sección 6): es un evento cerrado y controlado sin
-- autenticación real, así que cualquier celular con la anon key podría en
-- teoría liberar la fila de otra persona además de la propia. Se acepta ese
-- riesgo aquí igual que ya se acepta en players_claim_unclaimed.
-- ============================================================================

create policy "players_release_own" on players
  for update
  using (device_id is not null)
  with check (device_id is null);
