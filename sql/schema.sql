-- ============================================================================
-- QUANTUM by Brandex — Esquema Supabase (Postgres)
-- Ejecutar completo en el SQL Editor de Supabase (proyecto nuevo y vacío).
--
-- Si ya tenías el esquema anterior corriendo en producción/ensayo, NO vuelvas a
-- correr este archivo — usa sql/migration_002_roulette.sql en su lugar, que
-- altera las tablas existentes sin perder equipos/jugadores/puntajes.
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TEAMS — los 5 departamentos
-- ----------------------------------------------------------------------------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,          -- 'realizacion' | 'finanzas_admin' | 'creatividad' | 'produccion' | 'comerciales'
  name text not null,                 -- nombre visible
  color text not null default '#00F2FE',
  score int not null default 0,
  created_at timestamptz not null default now()
);

insert into teams (slug, name, color) values
  ('realizacion', 'Realización', '#00F2FE'),
  ('finanzas_admin', 'Finanzas & Administración', '#4FACFE'),
  ('creatividad', 'Creatividad', '#00FF87'),
  ('produccion', 'Producción', '#FF6EC7'),
  ('comerciales', 'Comerciales', '#FFD166')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. PLAYERS — el roster de las 60 personas, uno por integrante.
--    Puede pre-poblarse por SQL (ver sql/seed_roster_example.sql) con
--    device_id = null, y cada quien lo "reclama" desde /play tocando su
--    nombre; o puede crearse sobre la marcha si alguien no está en la lista.
-- ----------------------------------------------------------------------------
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  department_slug text not null references teams(slug), -- denormalizado a propósito: lectura directa sin join
  name text not null,
  avatar_url text,                    -- si es null, el cliente genera un avatar con lib/game/avatar.ts
  device_id text unique,              -- null hasta que alguien "reclama" esta fila desde su celular
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_players_team on players(team_id);
create index if not exists idx_players_department on players(department_slug);

-- ----------------------------------------------------------------------------
-- 3. GAME_STATE — fila única (singleton) que gobierna toda la sesión en vivo.
--    /admin escribe, /admin y /play se suscriben por Realtime a sus cambios.
-- ----------------------------------------------------------------------------
create table if not exists game_state (
  id smallint primary key default 1 check (id = 1),
  phase text not null default 'lobby'
    check (phase in ('lobby', 'roulette', 'intro', 'playing', 'locked', 'revealed', 'podium')),
  current_game smallint check (current_game between 1 and 3),   -- 1, 2 o 3
  current_round smallint check (current_round between 1 and 3), -- 1, 2 o 3 (3 rondas por juego)
  round_duration_seconds int not null default 45,
  round_ends_at timestamptz,           -- usado por los clientes para sincronizar el countdown
  -- Representante elegido por la ruleta en cada equipo para la ronda activa:
  -- { "<team_id>": { "player_id": "...", "name": "...", "avatar_url": "..." }, ... }
  active_representatives jsonb not null default '{}',
  payload jsonb not null default '{}', -- datos de revelación de la ronda (ver lib/game/rounds.ts)
  updated_at timestamptz not null default now()
);

insert into game_state (id, phase) values (1, 'lobby')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. RESPONSES — una respuesta por jugador, por juego y por ronda.
--    En la práctica solo el representante elegido por la ruleta puede insertar
--    (ver policy responses_insert_only_representative más abajo).
-- ----------------------------------------------------------------------------
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  game_number smallint not null check (game_number between 1 and 3),
  round_number smallint not null check (round_number between 1 and 3),
  answer jsonb not null,               -- number (juego1) | { code } (juego2) | string[4] (juego3)
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  unique (player_id, game_number, round_number)
);

create index if not exists idx_responses_round on responses(game_number, round_number);
create index if not exists idx_responses_team on responses(team_id);

-- ----------------------------------------------------------------------------
-- 5. LEADERBOARD — vista de solo lectura sobre teams.score (fuente de verdad).
--    Nota: Supabase Realtime (postgres_changes) no emite eventos sobre vistas;
--    la pantalla /admin se suscribe a la tabla `teams` y ordena en el cliente.
--    Se deja la vista para consultas puntuales / debugging.
-- ----------------------------------------------------------------------------
create or replace view leaderboard as
  select
    t.id as team_id,
    t.slug,
    t.name,
    t.color,
    t.score,
    rank() over (order by t.score desc) as position
  from teams t
  order by t.score desc;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
--    Evento cerrado y controlado: se habilita RLS con políticas permisivas
--    para lectura y auto-registro, pero el puntaje (teams.score), el estado
--    del juego (game_state) y quién puede responder (active_representatives)
--    SOLO se modifican desde el servidor con la service_role key (Route
--    Handlers de /admin), nunca directamente desde el cliente.
-- ----------------------------------------------------------------------------
alter table teams enable row level security;
alter table players enable row level security;
alter table game_state enable row level security;
alter table responses enable row level security;

-- Lectura pública (anon) de todo: la TV y los celulares necesitan ver el estado en vivo.
create policy "teams_select_all" on teams for select using (true);
create policy "game_state_select_all" on game_state for select using (true);
create policy "players_select_all" on players for select using (true);
create policy "responses_select_all" on responses for select using (true);

-- Alguien que no está en el roster pre-cargado puede registrarse sobre la marcha.
create policy "players_insert_public" on players for insert with check (true);

-- "Reclamar" una fila del roster: solo si nadie la ha reclamado todavía
-- (device_id is null), y el UPDATE debe dejarla con un device_id (no null).
-- Esto impide que un celular le robe la identidad a alguien que ya entró.
create policy "players_claim_unclaimed" on players
  for update
  using (device_id is null)
  with check (device_id is not null);

-- Solo puede insertar una respuesta el jugador que la ruleta eligió como
-- representante de su equipo en la ronda activa (game_state.active_representatives).
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

-- teams.score, game_state y active_representatives SOLO vía service_role
-- (sin policies de insert/update para anon => bloqueadas por defecto con RLS).

-- ----------------------------------------------------------------------------
-- 7. Realtime — publicar las tablas que /admin y /play necesitan escuchar
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table game_state;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table responses;

-- ----------------------------------------------------------------------------
-- 8. Reset de evento (ensayo general). Ejecutar manualmente entre pruebas.
--    Libera a todos los jugadores (no borra el roster) para poder re-reclamar
--    desde cero en el siguiente ensayo. Para borrar el roster por completo usa
--    `truncate table players cascade;` en vez del update.
-- ----------------------------------------------------------------------------
-- update players set device_id = null;
-- truncate table responses;
-- update teams set score = 0;
-- update game_state set phase = 'lobby', current_game = null, current_round = null,
--   round_ends_at = null, active_representatives = '{}', payload = '{}' where id = 1;
