"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import clsx from "clsx";

export function ConnectionBadge() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("connection-health")
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/70">
      <span
        className={clsx(
          "h-2 w-2 rounded-full",
          connected ? "bg-brand-green shadow-neon-green animate-pulse-glow" : "bg-red-500"
        )}
      />
      {connected ? "Supabase en vivo" : "Conectando…"}
    </div>
  );
}
