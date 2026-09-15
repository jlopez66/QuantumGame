-- ============================================================================
-- Migración 003 — Elimina el auto-registro libre en /play.
-- Ejecutar en el SQL Editor de Supabase sobre un proyecto que ya corrió
-- sql/schema.sql y sql/migration_002_roulette.sql.
--
-- El roster ahora se precarga por completo (ver sql/seed_roster_example.sql,
-- que además genera avatar_url automáticamente a partir del nombre). La UI
-- de /play ya no ofrece "No estoy en la lista / Registrarme", así que
-- cerramos también la policy de RLS que lo permitía a nivel de base de
-- datos, para que nadie pueda insertar jugadores por fuera de la app.
-- ============================================================================

drop policy if exists "players_insert_public" on players;
