/**
 * Contenido PÚBLICO de las 9 rondas (3 por juego). Se importa tanto en /admin
 * como en /play para renderizar exactamente la misma pregunta en ambas
 * pantallas sin ir a la base de datos. Las respuestas correctas de los
 * Juegos 1 y 2 NO viven aquí — están en lib/game/answers.ts (server-only)
 * para que nunca lleguen al bundle del celular antes de la revelación.
 */

export type GameNumber = 1 | 2 | 3;
export type RoundNumber = 1 | 2 | 3;

export interface PriceStep {
  kind: "price";
  game: 1;
  round: RoundNumber;
  title: string;
  comboName: string;
  comboDescription: string;
  imageUrl: string;
  duration: number; // segundos
}

export interface TruckOption {
  code: "A" | "B" | "C" | "D";
  label: string;
  m3: number;
  icon: "nhr" | "turbo" | "10ton" | "2turbos";
}

export interface CubicajeStep {
  kind: "cubicaje";
  game: 2;
  round: RoundNumber;
  title: string;
  montajeName: string;
  specs: string;
  imageUrl: string;
  options: TruckOption[];
  duration: number;
}

export interface BriefStep {
  kind: "brief";
  game: 3;
  round: RoundNumber;
  title: string;
  eventName: string;
  items: string[]; // los 4 elementos reales del brief, en orden
  slotOptions: string[][]; // opciones (incluye la correcta + distractores) para cada uno de los 4 selects
  introDuration: number; // segundos que se muestra la ficha
  duration: number; // segundos para reconstruirla a ciegas
}

export type Step = PriceStep | CubicajeStep | BriefStep;

export const TRUCK_OPTIONS: TruckOption[] = [
  { code: "A", label: "Camión NHR", m3: 8, icon: "nhr" },
  { code: "B", label: "Camión Turbo", m3: 14, icon: "turbo" },
  { code: "C", label: "Camión 10 Toneladas", m3: 28, icon: "10ton" },
  { code: "D", label: "2 Turbos Combinados", m3: 28, icon: "2turbos" },
];

export const STEPS: Step[] = [
  {
    kind: "price",
    game: 1,
    round: 1,
    title: "El Precio Exacto — Ronda 1",
    comboName: "Combo Mobiliario Lounge QUANTUM",
    comboDescription: "6 sillas Tolix negras, 2 mesas altas, alfombra LED y set de iluminación ambiental.",
    imageUrl: "/images/game1-round1.jpg",
    duration: 45,
  },
  {
    kind: "price",
    game: 1,
    round: 2,
    title: "El Precio Exacto — Ronda 2",
    comboName: "Combo Insumos Stand CustomX 3x3",
    comboDescription: "Estructura modular, gráfica impresa full color, mesón counter y TV 55'' con soporte.",
    imageUrl: "/images/game1-round2.jpg",
    duration: 45,
  },
  {
    kind: "price",
    game: 1,
    round: 3,
    title: "El Precio Exacto — Ronda 3",
    comboName: "Combo Producción Audiovisual QUANTUM",
    comboDescription: "2 cámaras 4K, switcher en vivo, set de micrófonos inalámbricos y operador por 8 horas.",
    imageUrl: "/images/game1-round3.jpg",
    duration: 45,
  },
  {
    kind: "cubicaje",
    game: 2,
    round: 1,
    title: "Desafío de Cubicaje — Ronda 1",
    montajeName: "Escenografía Gala Aniversario 40 años",
    specs: "Montaje total: 3 pórticos truss, tarima 8x6m, mobiliario lounge y backing gráfico — 13.5 m³",
    imageUrl: "/images/game2-round1.jpg",
    options: TRUCK_OPTIONS,
    duration: 30,
  },
  {
    kind: "cubicaje",
    game: 2,
    round: 2,
    title: "Desafío de Cubicaje — Ronda 2",
    montajeName: "Activación BTL Centro Comercial",
    specs: "Stand 6x6m desarmable + mobiliario + 40 kits de merchandising — 27 m³",
    imageUrl: "/images/game2-round2.jpg",
    options: TRUCK_OPTIONS,
    duration: 30,
  },
  {
    kind: "cubicaje",
    game: 2,
    round: 3,
    title: "Desafío de Cubicaje — Ronda 3",
    montajeName: "Feria Sectorial Stand Doble Piso",
    specs: "Estructura 8x8m de dos niveles, escalera, mobiliario lounge superior e inferior — 21 m³",
    imageUrl: "/images/game2-round3.jpg",
    options: TRUCK_OPTIONS,
    duration: 30,
  },
  {
    kind: "brief",
    game: 3,
    round: 1,
    title: "Reconstructor de Brief — Ronda 1",
    eventName: "Lanzamiento Producto Aurora",
    items: ["3 Salas Velvet Negras", "50 Kits KeepMe", "1 Stand CustomX 3x3m", "Envío Express"],
    slotOptions: [
      ["3 Salas Velvet Negras", "2 Salas Velvet Negras", "3 Salas Velvet Blancas", "5 Salas Velvet Negras"],
      ["50 Kits KeepMe", "100 Kits KeepMe", "50 Kits Welcome", "30 Kits KeepMe"],
      ["1 Stand CustomX 3x3m", "1 Stand CustomX 6x3m", "2 Stands CustomX 3x3m", "1 Stand Modular 3x3m"],
      ["Envío Express", "Envío Estándar", "Envío Internacional", "Recogida en bodega"],
    ],
    introDuration: 10,
    duration: 30,
  },
  {
    kind: "brief",
    game: 3,
    round: 2,
    title: "Reconstructor de Brief — Ronda 2",
    eventName: "Convención Anual de Ventas",
    items: ["2 Tarimas 4x3m", "80 Sillas Tiffany Doradas", "1 Pantalla LED P3 6x3m", "Catering para 200 personas"],
    slotOptions: [
      ["2 Tarimas 4x3m", "1 Tarima 4x3m", "2 Tarimas 6x3m", "3 Tarimas 4x3m"],
      ["80 Sillas Tiffany Doradas", "80 Sillas Tiffany Plateadas", "50 Sillas Tiffany Doradas", "80 Sillas Cross Back"],
      ["1 Pantalla LED P3 6x3m", "1 Pantalla LED P4 6x3m", "2 Pantallas LED P3 3x3m", "1 Pantalla LED P3 8x4m"],
      ["Catering para 200 personas", "Catering para 150 personas", "Coffee break para 200 personas", "Catering para 250 personas"],
    ],
    introDuration: 10,
    duration: 30,
  },
  {
    kind: "brief",
    game: 3,
    round: 3,
    title: "Reconstructor de Brief — Ronda 3",
    eventName: "Activación de Marca Mall Plaza",
    items: ["4 Islas Modulares 2x2m", "200 Globos Metálicos Dorados", "1 DJ Booth con Iluminación", "Certificado de Manejo de Residuos"],
    slotOptions: [
      ["4 Islas Modulares 2x2m", "4 Islas Modulares 3x3m", "2 Islas Modulares 2x2m", "4 Islas Modulares 2x3m"],
      ["200 Globos Metálicos Dorados", "150 Globos Metálicos Dorados", "200 Globos Metálicos Plateados", "200 Globos de Látex Dorados"],
      ["1 DJ Booth con Iluminación", "1 DJ Booth sin Iluminación", "2 DJ Booth con Iluminación", "1 Escenario con DJ Booth"],
      ["Certificado de Manejo de Residuos", "Certificado de Seguridad Industrial", "Póliza de Responsabilidad Civil", "Certificado de Manejo Ambiental"],
    ],
    introDuration: 10,
    duration: 30,
  },
];

export const STEP_ORDER: Array<{ game: GameNumber; round: RoundNumber }> = STEPS.map((s) => ({
  game: s.game,
  round: s.round,
}));

export function getStep(game: GameNumber | null, round: RoundNumber | null): Step | null {
  if (!game || !round) return null;
  return STEPS.find((s) => s.game === game && s.round === round) ?? null;
}

export function getStepIndex(game: GameNumber | null, round: RoundNumber | null): number {
  if (!game || !round) return -1;
  return STEP_ORDER.findIndex((s) => s.game === game && s.round === round);
}

export function getNextStep(game: GameNumber | null, round: RoundNumber | null): Step | null {
  const idx = getStepIndex(game, round);
  if (idx === -1) return STEPS[0] ?? null; // desde el lobby -> primer paso
  const next = STEP_ORDER[idx + 1];
  return next ? getStep(next.game, next.round) : null; // null => fin, pasa a podio
}

export const TOTAL_STEPS = STEPS.length;
