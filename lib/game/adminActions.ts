"use client";

export type AdminAction = "start" | "lock" | "reveal" | "next" | "reset" | "start_timer" | "repeat_round";

export async function callAdminAction(action: AdminAction) {
  const res = await fetch("/api/admin-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  let json: { ok?: boolean; error?: string } = {};
  try {
    json = await res.json();
  } catch {
    // El servidor respondió algo que no es JSON (ej. se cayó el proceso de
    // Next y devolvió su página de error en texto plano) — no truena feo con
    // un error de parseo, se reporta con el status HTTP real.
    throw new Error(`El servidor no respondió correctamente (HTTP ${res.status}). Reinicia "npm run dev" e intenta de nuevo.`);
  }

  if (!res.ok || json?.ok === false) {
    const message = json?.error ?? `Error ${res.status} al ejecutar "${action}"`;
    console.error("[admin-action]", message);
    throw new Error(message);
  }
  return json;
}
