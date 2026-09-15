import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente Supabase con service_role key — SOLO para Route Handlers.
 * Bypassa RLS: es el único punto autorizado para tocar game_state.phase
 * y teams.score, evitando que un celular en /play pueda hacer trampa.
 * NUNCA importar este módulo desde un componente 'use client'.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
