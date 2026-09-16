import "server-only";

/**
 * Respuestas correctas de los Juegos 1 y 2, más el dato jugoso que se revela
 * en pantalla junto al resultado (adminFunFact). SOLO se importa desde Route
 * Handlers (app/api/**). Si algún día se importa por error desde un
 * componente 'use client', el paquete `server-only` rompe el build en vez de
 * filtrar el dato al bundle del celular antes de tiempo.
 *
 * Los 3 juegos usan la misma tabla: la respuesta correcta y el fun fact NO se
 * conocen hasta la revelación, ni siquiera para el Juego 3 ("Ojo de Águila"),
 * cuyo GIF/foto en `media` es público (se proyecta en pantalla) pero cuya
 * respuesta correcta se queda oculta aquí igual que en los otros dos juegos.
 */

export interface TriviaAnswer {
  correctAnswer: string | number;
  adminFunFact: string;
}

// Ronda 0-3 del Juego 1 (0 = calentamiento sin puntos).
export const GAME1_ANSWERS: Record<0 | 1 | 2 | 3, TriviaAnswer> = {
  0: {
    correctAnswer: "MÁS",
    adminFunFact:
      "¡Cuesta $146.000! Más que los combos, pero vale toda la pena. Ya saben cómo funciona, ¡arrancamos por puntos!",
  },
  1: {
    correctAnswer: "MENOS",
    adminFunFact: "¡Cuesta solo $80.000 por los 3 días! Sale más barato que ir a sudar al gym.",
  },
  2: {
    correctAnswer: "C) $1.742.000",
    adminFunFact:
      "¡La respuesta es $1.742.000! (7 Sofás = $1.022.000 + 9 Mesas = $720.000). ¡Un solo error llevando la suma y caían en la trampa!",
  },
  3: {
    correctAnswer: 545_000,
    adminFunFact: "¡El valor exacto es $545.000 COP! Puntos para la mesa que haya cotizado más cerca sin pasarse.",
  },
};

// Ronda 0-3 del Juego 2 — "KeepMe y Servicios" (0 = calentamiento sin puntos).
export const GAME2_ANSWERS: Record<0 | 1 | 2 | 3, TriviaAnswer> = {
  0: {
    correctAnswer: "AUTOMÁTICO",
    adminFunFact: "¡Adiós al WhatsApp a deshoras! QUANTUM descuenta, reserva y avisa automáticamente. ¡Calentamos motores!",
  },
  1: {
    correctAnswer: "2 Camiones NHR",
    adminFunFact:
      "¡2 NHR! (9 + 9 = 18 m³). La Turbo se quedaba corta con 15, y mezclar camiones era botar la plata. ¡El algoritmo nos cuida el bolsillo!",
  },
  2: {
    correctAnswer: "Ir a la página de KeepMe y solicitar reserva de espacio.",
    adminFunFact: "¡Exacto! Se acabaron los sobornos con empanadas y los correos de auxilio. Si no hay reserva en KeepMe, ¡no hay espacio!",
  },
  3: {
    correctAnswer: "Entrar a QUANTUM y ver el tracking en tiempo real.",
    adminFunFact: "¡Adiós a la llamadera! Con QUANTUM tenemos visibilidad total de la carga. ¡Paz mental para todos!",
  },
};

// Ronda 0-3 del Juego 3 — "Ojo de Águila" (0 = calentamiento sin puntos).
export const GAME3_ANSWERS: Record<0 | 1 | 2 | 3, TriviaAnswer> = {
  0: {
    correctAnswer: "AMARILLO",
    adminFunFact: "¡Era Amarillo! Así calentamos los ojos. ¡Atentos a las animaciones!",
  },
  1: {
    correctAnswer: "3 CAJAS",
    adminFunFact: "¡Fueron 3 cajas azules! En la logística real, ni una caja se puede quedar.",
  },
  2: {
    correctAnswer: "CONSOLA DE AUDIO",
    adminFunFact: "¡La Consola de Audio! El orden de ensamble es sagrado.",
  },
  3: {
    correctAnswer: "ETIQUETA ROJA",
    adminFunFact: "¡Etiqueta Roja! El cuidado de los equipos empieza desde bodega.",
  },
};
