"use client";

export type AdminAction = "start" | "lock" | "reveal" | "next" | "reset" | "start_timer";

export async function callAdminAction(action: AdminAction) {
  const res = await fetch("/api/admin-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const json = await res.json();
  if (!res.ok || json?.ok === false) {
    const message = json?.error ?? `Error ${res.status} al ejecutar "${action}"`;
    console.error("[admin-action]", message);
    throw new Error(message);
  }
  return json;
}
