# Media del Juego 3 — "Ojo de Águila"

Sube aquí los 4 archivos referenciados en `lib/game/rounds-data.ts` (mismo nombre exacto, minúsculas). Se proyectan en `/admin` durante 10 segundos (fase `intro`) ANTES de que aparezca la pregunta — el celular no muestra nada del contenido hasta que el host presiona "Iniciar Conteo" y avanza a la fase de pregunta.

- `inflable.webp` — Ronda 0, calentamiento (foto fija).
- `camion.gif` — Ronda 1 (cajas cargándose en el camión).
- `secuencia.gif` — Ronda 2 (secuencia de montaje).
- `banda.gif` — Ronda 3 (banda transportadora / etiqueta Anvil).

Los `.gif` se muestran con una etiqueta `<img>` normal (no con `next/image`) a propósito: el optimizador de imágenes de Next congela el primer frame de los GIFs, y aquí necesitamos que la animación se reproduzca completa en la pantalla grande.

Si un archivo no existe, esa ronda simplemente no muestra nada durante la fase `intro` (no rompe el resto de la app) — pero el conteo y la pregunta siguen funcionando igual.
