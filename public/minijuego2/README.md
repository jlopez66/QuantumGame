# Imágenes del Juego 2 — "KeepMe y Servicios"

Sube aquí las 4 imágenes referenciadas en `lib/game/rounds-data.ts` (mismo nombre exacto, minúsculas, formato `.png`):

- `kits-bienvenida.png` — Ronda 0, calentamiento (Kits de Bienvenida).
- `cubicaje-automatico.png` — Ronda 1 (cubicaje del camión).
- `reserva-bodega.png` — Ronda 2 (reserva de espacio en KeepMe).
- `tracking-tiempo-real.png` — Ronda 3 (tracking del envío a Cartagena).

Igual que en el Juego 1: se muestran sobre fondo blanco, completas y sin recortar (`object-contain`), así que no importa si el PNG trae fondo transparente. Si un archivo no existe, esa ronda simplemente no muestra imagen (usa la tarjeta de solo texto) — no rompe el resto de la app.
