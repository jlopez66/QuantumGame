/**
 * Contenido PÚBLICO de las 12 rondas (4 por cada uno de los 3 minijuegos).
 * Se importa tanto en /admin como en /play para renderizar exactamente la
 * misma pregunta en ambas pantallas sin ir a la base de datos.
 *
 * Las respuestas correctas de los 3 juegos NO viven aquí — están en
 * lib/game/answers.ts (server-only) para que nunca lleguen al bundle del
 * celular antes de la revelación.
 *
 * lib/game/rounds.ts consume este archivo y expone la navegación entre
 * pasos (getStep, getNextStep, etc.) — edita AQUÍ el guion de cada minijuego.
 */

export type GameNumber = 1 | 2 | 3;
// Ronda 0 = calentamiento sin puntos. Los 3 juegos usan 0-3.
export type RoundNumber = 0 | 1 | 2 | 3;

// ----------------------------------------------------------------------------
// Los 3 minijuegos comparten el mismo trío de formatos de pregunta/respuesta:
//   JUEGO 1 — "Cifra Exacta": calentamiento + más/menos + puzzle + número exacto
//   JUEGO 2 — "KeepMe y Servicios": calentamiento + 3 preguntas de opción múltiple
//   JUEGO 3 — "Ojo de Águila": calentamiento + 3 preguntas sobre un video
//             proyectado en /admin durante la fase `intro` (ver `media` +
//             `introDuration` abajo) — el celular no muestra la pregunta ni
//             las opciones hasta que el host avanza a la fase `playing`.
// ----------------------------------------------------------------------------
export interface BinaryChoiceStep {
  kind: "binary_choice";
  game: GameNumber;
  round: RoundNumber;
  title: string;
  images: string[]; // 1 o más fotos de producto; [] si la ronda es de puro texto
  question: string;
  options: [string, string];
  points: number;
  duration: number; // segundos para responder
  media?: string; // video (.mp4) que se proyecta en /admin ANTES de la pregunta
  introDuration?: number; // segundos que se proyecta `media` (requiere `media`)
}

export interface MultipleChoiceStep {
  kind: "multiple_choice";
  game: GameNumber;
  round: RoundNumber;
  title: string;
  images: string[];
  question: string;
  options: string[];
  points: number;
  duration: number;
  media?: string;
  introDuration?: number;
}

export interface NumericInputStep {
  kind: "numeric_input";
  game: GameNumber;
  round: RoundNumber;
  title: string;
  images: string[];
  question: string;
  points: number;
  duration: number;
  media?: string;
  introDuration?: number;
}

export type Step = BinaryChoiceStep | MultipleChoiceStep | NumericInputStep;

export const STEPS: Step[] = [
  // -------------------------- JUEGO 1 (4 rondas) ---------------------------
  {
    kind: "binary_choice",
    game: 1,
    round: 0,
    title: "Calentamiento: Poltrona Finn",
    images: ["/products/ST29.webp"],
    question:
      "¿Alquilar esta Poltrona por 3 DÍAS cuesta MÁS o MENOS que invitar a comer 2 combos de hamburguesa artesanal (Aprox. $80.000)?",
    options: ["MÁS", "MENOS"],
    points: 0,
    duration: 20,
  },
  {
    kind: "binary_choice",
    game: 1,
    round: 1,
    title: "Mesa TB33 vs. Mensualidad de Gym",
    images: ["/products/TB33.webp"],
    question:
      "¿Alquilar esta Mesa por 3 DÍAS ENTEROS cuesta MÁS o MENOS que pagar un mes de gimnasio promedio (Aprox. $110.000)?",
    options: ["MÁS", "MENOS"],
    points: 100,
    duration: 30,
  },
  {
    kind: "multiple_choice",
    game: 1,
    round: 2,
    title: "Matemática Rápida: Bajo Presión",
    images: ["/products/ST23.webp", "/products/TB33.webp"],
    question:
      "Rompecabezas nivel Dios: Si 1 Sofá Yara vale $146.000 y 1 Mesa TB33 vale $80.000... ¿Cuánto suma exactamente alquilar 7 SOFÁS y 9 MESAS?",
    options: ["A) $1.732.000", "B) $1.722.000", "C) $1.742.000", "D) $1.752.000"],
    points: 200,
    duration: 40,
  },
  {
    kind: "numeric_input",
    game: 1,
    round: 3,
    title: "Modo Leyenda: El Set Completo",
    images: ["/products/ST27.webp", "/products/ST29.webp", "/products/TB34.webp"],
    question:
      "Pónganse la 10. Escriban el NÚMERO EXACTO del valor total por alquilar este SET COMPLETO (1 Sofá + 2 Poltronas + 1 Mesa) por 3 días.",
    points: 500,
    duration: 60,
  },

  // -------------------------- JUEGO 2 (4 rondas) ---------------------------
  // "KeepMe y Servicios" — puro texto y lógica, sin fotos de producto.
  {
    kind: "binary_choice",
    game: 2,
    round: 0,
    title: "Calentamiento: Kits de Bienvenida",
    images: ["/minijuego2/kits-bienvenida.png"],
    question:
      "¿En QUANTUM, cuando apruebas 150 Kits de Bienvenida, el inventario se descuenta AUTOMÁTICAMENTE o todavía hay que mandarle un WhatsApp a César?",
    options: ["AUTOMÁTICO", "WHATSAPP A CÉSAR"],
    points: 0,
    duration: 20,
  },
  {
    kind: "multiple_choice",
    game: 2,
    round: 1,
    title: "Cubicaje Automático",
    images: ["/minijuego2/cubicaje-automatico.png"],
    question:
      "QUANTUM cubica todo solo. Si un evento suma 17 m³, un NHR carga 9 m³ y una Turbo carga 15 m³... ¿Qué asignará la app para llevar todo sin desperdiciar presupuesto?",
    options: ["1 Turbo", "2 Camiones NHR", "1 Turbo + 1 NHR", "1 Camión de 10T"],
    points: 100,
    duration: 30,
  },
  {
    kind: "multiple_choice",
    game: 2,
    round: 2,
    title: "Reserva de Bodega",
    images: ["/minijuego2/reserva-bodega.png"],
    question: "Un cliente necesita guardar material en nuestra bodega para una gira de eventos. ¿Cuál es el PRIMER paso oficial?",
    options: [
      "Dejar las cajas tiradas en recepción y salir corriendo.",
      "Sobornar a César con unas empanadas para un 'campito'.",
      "Ir a la página de KeepMe y solicitar reserva de espacio.",
      "Mandar un correo con asunto 'URGENTE' y cruzar los dedos.",
    ],
    points: 100,
    duration: 30,
  },
  {
    kind: "multiple_choice",
    game: 2,
    round: 3,
    title: "Tracking en Tiempo Real",
    images: ["/minijuego2/tracking-tiempo-real.png"],
    question:
      "Viernes 4:00 PM. El cliente llama en pánico preguntando si los 500 kits ya llegaron al evento en Cartagena. ¿Tú qué haces?",
    options: [
      "Llamar al conductor 15 veces seguidas hasta que conteste.",
      "Decirle 'Tranqui, eso ya debe estar por llegar, jefe'.",
      "Rezarle a la Virgen de los transportadores.",
      "Entrar a QUANTUM y ver el tracking en tiempo real.",
    ],
    points: 100,
    duration: 30,
  },

  // -------------------------- JUEGO 3 (4 rondas) ---------------------------
  // "Ojo de Águila" — se proyecta `media` en /admin durante 10s (fase intro,
  // el celular solo ve "atento a la pantalla"); al pasar a `playing`, tanto
  // /admin como /play muestran la pregunta y las 4 opciones.
  {
    kind: "multiple_choice",
    game: 3,
    round: 0,
    title: "Calentamiento: Ojo de Águila",
    images: [],
    media: "/minijuego3/inflable.mp4",
    introDuration: 10,
    question: "¿De qué color era el inflable triste de la foto que acabas de ver?",
    options: ["ROJO", "VERDE NEÓN", "AMARILLO", "AZUL"],
    points: 0,
    duration: 20,
  },
  {
    kind: "multiple_choice",
    game: 3,
    round: 1,
    title: "Carga Rápida",
    images: [],
    media: "/minijuego3/camion.mp4",
    introDuration: 10,
    question: "¡Rápido! ¿Cuántas cajas azules de KeepMe cargaron en el camión?",
    options: ["2 CAJAS", "3 CAJAS", "4 CAJAS", "5 CAJAS"],
    points: 100,
    duration: 20,
  },
  {
    kind: "multiple_choice",
    game: 3,
    round: 2,
    title: "Memoria de Montaje",
    images: [],
    media: "/minijuego3/secuencia.mp4",
    introDuration: 10,
    question: "¡Memoria! Según la secuencia que acaba de pasar, ¿cuál fue el TERCER elemento en instalarse?",
    options: ["ESTRUCTURA TRUSS", "SILLAS", "PANTALLA LED", "CONSOLA DE AUDIO"],
    points: 100,
    duration: 20,
  },
  {
    kind: "multiple_choice",
    game: 3,
    round: 3,
    title: "Etiqueta Frágil",
    images: [],
    media: "/minijuego3/banda.mp4",
    introDuration: 10,
    question: "¿Qué color de etiqueta tenía la caja Anvil que decía 'FRÁGIL'?",
    options: ["ETIQUETA VERDE", "ETIQUETA ROJA", "ETIQUETA AZUL", "ETIQUETA AMARILLA"],
    points: 100,
    duration: 20,
  },
];
