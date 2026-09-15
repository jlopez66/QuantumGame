"use client";

export type AdminAction = "start" | "lock" | "reveal" | "next" | "reset";

export async function callAdminAction(action: AdminAction) {
  const res = await fetch("/api/admin-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return res.json();
}
