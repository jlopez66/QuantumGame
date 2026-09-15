export interface Department {
  slug: string;
  name: string;
  color: string;
}

// Debe coincidir exactamente con el seed de `teams` en sql/schema.sql
export const DEPARTMENTS: Department[] = [
  { slug: "realizacion", name: "Realización", color: "#00F2FE" },
  { slug: "finanzas_admin", name: "Finanzas & Administración", color: "#4FACFE" },
  { slug: "creatividad", name: "Creatividad", color: "#00FF87" },
  { slug: "produccion", name: "Producción", color: "#FF6EC7" },
  { slug: "comerciales", name: "Comerciales", color: "#FFD166" },
];
