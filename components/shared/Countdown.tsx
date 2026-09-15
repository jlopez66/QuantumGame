"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface CountdownProps {
  endsAt: string | null;
  totalSeconds: number;
  onComplete?: () => void;
  size?: "sm" | "lg";
}

export function Countdown({ endsAt, totalSeconds, onComplete, size = "lg" }: CountdownProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    if (!endsAt) {
      setRemaining(totalSeconds);
      return;
    }

    const tick = () => {
      const diffMs = new Date(endsAt).getTime() - Date.now();
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setRemaining(secs);
      if (secs <= 0 && !firedRef.current) {
        firedRef.current = true;
        onComplete?.();
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, totalSeconds]);

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const critical = remaining <= 5;
  const dim = size === "lg" ? 220 : 96;
  const stroke = size === "lg" ? 14 : 8;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={radius} stroke="#1A1A1A" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          stroke="url(#quantumGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.2, ease: "linear" }}
        />
        <defs>
          <linearGradient id="quantumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="50%" stopColor="#4FACFE" />
            <stop offset="100%" stopColor="#00FF87" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={clsx(
          "absolute font-heading font-extrabold tabular-nums",
          size === "lg" ? "text-6xl" : "text-2xl",
          critical ? "text-red-400 animate-pulse-glow" : "text-white"
        )}
      >
        {remaining}
      </span>
    </div>
  );
}
