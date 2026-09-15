export type Phase =
  | "lobby"
  | "roulette"
  | "intro"
  | "playing"
  | "locked"
  | "revealed"
  | "podium";

// NOTA: estos tipos usan `type` (no `interface`) a propósito. El parser de
// tipos de @supabase/postgrest-js infiere mal el resultado de `select("*")`
// (todo termina en `never`) cuando Row/Insert/Update de la `Database` vienen
// de `interface` en vez de `type` — es una particularidad conocida de cómo
// TS resuelve conditional types contra interfaces vs. object type aliases.

export type TeamRow = {
  id: string;
  slug: string;
  name: string;
  color: string;
  score: number;
  created_at: string;
};

export type TeamInsert = {
  id?: string;
  slug: string;
  name: string;
  color?: string;
  score?: number;
  created_at?: string;
};

export type TeamUpdate = {
  id?: string;
  slug?: string;
  name?: string;
  color?: string;
  score?: number;
  created_at?: string;
};

export type PlayerRow = {
  id: string;
  team_id: string;
  department_slug: string;
  name: string;
  avatar_url: string | null;
  device_id: string | null;
  created_at: string;
  last_seen_at: string;
};

export type PlayerInsert = {
  id?: string;
  team_id: string;
  department_slug: string;
  name: string;
  avatar_url?: string | null;
  device_id?: string | null;
  created_at?: string;
  last_seen_at?: string;
};

export type PlayerUpdate = {
  id?: string;
  team_id?: string;
  department_slug?: string;
  name?: string;
  avatar_url?: string | null;
  device_id?: string | null;
  created_at?: string;
  last_seen_at?: string;
};

export type RevealTeamResult = {
  team_id: string;
  team_name: string;
  color: string;
  representative_name: string | null;
  submitted: unknown;
  points: number;
};

export type RevealPayload = {
  correctAnswer: unknown;
  results: RevealTeamResult[];
};

export type GameStatePayload = { reveal?: RevealPayload } | Record<string, never>;

// Representante elegido por la ruleta para cada equipo en la ronda activa,
// indexado por team_id (las claves de un jsonb siempre llegan como string).
export type ActiveRepresentative = {
  player_id: string;
  name: string;
  avatar_url: string | null;
};

export type ActiveRepresentatives = Record<string, ActiveRepresentative>;

export type GameStateRow = {
  id: number;
  phase: Phase;
  current_game: 1 | 2 | 3 | null;
  current_round: 1 | 2 | 3 | null;
  round_duration_seconds: number;
  round_ends_at: string | null;
  active_representatives: ActiveRepresentatives;
  payload: GameStatePayload;
  updated_at: string;
};

export type GameStateInsert = {
  id?: number;
  phase?: Phase;
  current_game?: 1 | 2 | 3 | null;
  current_round?: 1 | 2 | 3 | null;
  round_duration_seconds?: number;
  round_ends_at?: string | null;
  active_representatives?: ActiveRepresentatives;
  payload?: GameStatePayload;
  updated_at?: string;
};

export type GameStateUpdate = {
  id?: number;
  phase?: Phase;
  current_game?: 1 | 2 | 3 | null;
  current_round?: 1 | 2 | 3 | null;
  round_duration_seconds?: number;
  round_ends_at?: string | null;
  active_representatives?: ActiveRepresentatives;
  payload?: GameStatePayload;
  updated_at?: string;
};

export type ResponseRow = {
  id: string;
  player_id: string;
  team_id: string;
  game_number: 1 | 2 | 3;
  round_number: 1 | 2 | 3;
  answer: unknown;
  points_awarded: number;
  created_at: string;
};

export type ResponseInsert = {
  id?: string;
  player_id: string;
  team_id: string;
  game_number: 1 | 2 | 3;
  round_number: 1 | 2 | 3;
  answer: unknown;
  points_awarded?: number;
  created_at?: string;
};

export type ResponseUpdate = {
  id?: string;
  player_id?: string;
  team_id?: string;
  game_number?: 1 | 2 | 3;
  round_number?: 1 | 2 | 3;
  answer?: unknown;
  points_awarded?: number;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      teams: { Row: TeamRow; Insert: TeamInsert; Update: TeamUpdate; Relationships: [] };
      players: { Row: PlayerRow; Insert: PlayerInsert; Update: PlayerUpdate; Relationships: [] };
      game_state: { Row: GameStateRow; Insert: GameStateInsert; Update: GameStateUpdate; Relationships: [] };
      responses: { Row: ResponseRow; Insert: ResponseInsert; Update: ResponseUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
