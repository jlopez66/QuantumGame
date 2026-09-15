-- ============================================================================
-- Migración 002 — Ruleta de Representantes por Mesa + 3 rondas por juego
-- Ejecutar en el SQL Editor de Supabase sobre un proyecto que YA tiene corrido
-- sql/schema.sql (la versión anterior). No borra equipos, jugadores ni
-- puntajes existentes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Renombra el slug de Finanzas para que coincida con el de la nueva
--    dinámica ('finanzas' -> 'finanzas_admin'). No-op si ya lo corriste.
-- ----------------------------------------------------------------------------
update teams set slug = 'finanzas_admin' where slug = 'finanzas';

-- ----------------------------------------------------------------------------
-- 1. PLAYERS: nickname -> name, + department_slug + avatar_url,
--    device_id pasa a ser reclamable (nullable) en vez de obligatorio.
-- ----------------------------------------------------------------------------
alter table players rename column nickname to name;

alter table players add column if not exists department_slug text;
update players p set department_slug = t.slug
  from teams t
  where p.team_id = t.id and p.department_slug is null;
alter table players alter column department_slug set not null;
alter table players add constraint players_department_slug_fkey
  foreign key (department_slug) references teams(slug);

alter table players add column if not exists avatar_url text;

alter table players alter column device_id drop not null;

create index if not exists idx_players_department on players(department_slug);

-- ----------------------------------------------------------------------------
-- 2. GAME_STATE: nueva fase 'roulette', 3 rondas por juego, y la columna
--    active_representatives que guarda quién puede responder en la ronda activa.
-- ----------------------------------------------------------------------------
alter table game_state add column if not exists active_representatives jsonb not null default '{}';

alter table game_state drop constraint if exists game_state_phase_check;
alter table game_state add constraint game_state_phase_check
  check (phase in ('lobby', 'roulette', 'intro', 'playing', 'locked', 'revealed', 'podium'));

alter table game_state drop constraint if exists game_state_current_round_check;
alter table game_state add constraint game_state_current_round_check
  check (current_round between 1 and 3);

-- ----------------------------------------------------------------------------
-- 3. RESPONSES: el check de round_number ahora permite hasta 3.
-- ----------------------------------------------------------------------------
alter table responses drop constraint if exists responses_round_number_check;
alter table responses add constraint responses_round_number_check
  check (round_number between 1 and 3);

-- ----------------------------------------------------------------------------
-- 4. RLS: reemplaza las policies de reclamar jugador y de insertar respuesta
--    para que solo el representante elegido por la ruleta pueda responder.
-- ----------------------------------------------------------------------------
drop policy if exists "players_update_own" on players;
create policy "players_claim_unclaimed" on players
  for update
  using (device_id is null)
  with check (device_id is not null);

drop policy if exists "responses_insert_public" on responses;
create policy "responses_insert_only_representative" on responses
  for insert
  with check (
    points_awarded = 0
    and exists (
      select 1 from game_state gs
      where gs.id = 1
        and (gs.active_representatives -> team_id::text ->> 'player_id') = player_id::text
    )
  );

-- ----------------------------------------------------------------------------
-- Listo. Ahora corre sql/seed_roster_example.sql para pre-cargar el roster
-- de las 60 personas (obligatorio: /play ya no tiene auto-registro libre,
-- solo se puede reclamar un nombre ya existente en la lista) y luego
-- sql/migration_003_remove_self_register.sql para cerrar la policy de RLS
-- que lo permitía.
-- ============================================================================
