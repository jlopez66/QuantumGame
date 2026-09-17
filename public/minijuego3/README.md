# Media del Juego 3 — "Ojo de Águila"

Sube aquí los 4 videos referenciados en `lib/game/rounds-data.ts` (mismo nombre exacto, minúsculas, formato `.mp4`). Se proyectan en `/admin` durante 10 segundos (fase `intro`) ANTES de que aparezca la pregunta — el celular no muestra nada del contenido hasta que el host presiona "Iniciar Conteo" y avanza a la fase de pregunta.

- `inflable.mp4` — Ronda 0, calentamiento.
- `camion.mp4` — Ronda 1 (cajas cargándose en el camión).
- `secuencia.mp4` — Ronda 2 (secuencia de montaje).
- `banda.mp4` — Ronda 3 (banda transportadora / etiqueta Anvil).

El video se reproduce con `autoplay`, `muted` y `loop` (silencioso porque los navegadores bloquean el autoplay con sonido) — si el clip dura menos que los 10 segundos del `intro`, simplemente se repite hasta que el host presione "Iniciar Conteo" para pasar a la pregunta.

Si prefieres subir un GIF o una foto fija en vez de video para alguna ronda, funciona igual: el componente detecta la extensión del archivo (`.mp4`/`.webm`/`.mov` = video; cualquier otra = imagen) y elige automáticamente cómo mostrarlo — solo actualiza la ruta en `lib/game/rounds-data.ts` con la extensión real.

Si un archivo no existe, esa ronda simplemente no muestra nada durante la fase `intro` (no rompe el resto de la app) — pero el conteo y la pregunta siguen funcionando igual.
