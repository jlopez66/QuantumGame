"use client";

import { motion } from "framer-motion";
import { DEPARTMENTS } from "@/lib/game/departments";

interface Props {
  selected: string | null;
  onSelect: (slug: string) => void;
}

export function DepartmentGrid({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {DEPARTMENTS.map((dept) => (
        <motion.button
          key={dept.slug}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(dept.slug)}
          className="card-quantum flex items-center justify-between border-l-4 px-5 py-4 text-left transition"
          style={{
            borderLeftColor: dept.color,
            boxShadow: selected === dept.slug ? `0 0 20px ${dept.color}55` : undefined,
            backgroundColor: selected === dept.slug ? `${dept.color}1A` : undefined,
          }}
        >
          <span className="font-heading font-bold text-white">{dept.name}</span>
          {selected === dept.slug && <span style={{ color: dept.color }}>●</span>}
        </motion.button>
      ))}
    </div>
  );
}
