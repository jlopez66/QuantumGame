# Imágenes del Juego 1

Sube aquí las 5 fotos referenciadas en `lib/game/rounds-data.ts` (mismo nombre exacto, MAYÚSCULA SOSTENIDA, formato `.webp`). Algunas rondas muestran más de un producto a la vez, uno al lado del otro:

- `ST29.webp` — Poltrona Finn (Ronda 0, calentamiento; también aparece en la Ronda 3)
- `TB33.webp` — Mesa TB33 (Ronda 1; también aparece en la Ronda 2)
- `ST23.webp` — Sofá Yara (Ronda 2, junto a `TB33.webp`)
- `ST27.webp` — (Ronda 3, junto a `ST29.webp` y `TB34.webp`)
- `TB34.webp` — (Ronda 3)

Si un archivo no existe, Next.js simplemente muestra el espacio de imagen roto en esa tarjeta — no rompe el resto de la app. Con 1 sola imagen se recorta a pantalla completa (`object-cover`); con 2 o más, se muestran completas una al lado de la otra en una grilla (`object-contain`).
