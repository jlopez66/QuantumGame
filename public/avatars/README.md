# Fotos del roster

Cada subcarpeta corresponde al `slug` de un departamento (ver `lib/game/departments.ts`
y la tabla `teams`):

- `realizacion/`
- `finanzas_admin/`
- `creatividad/`
- `produccion/`
- `comerciales/`

Sube cada foto como `.jpg`, `.jpeg`, `.png` o `.webp` con el nombre de
archivo igual al nombre completo de la persona. Tildes, ñ, espacios y
mayúsculas están bien — `scripts/seed-from-files.js` los usa tal cual para
el nombre que se muestra en pantalla:

```
comerciales/María Paula Arrubla Giraldo.png
realizacion/Juan Alejandro Montoya.png
```

(También funciona el formato `nombre_apellido.jpg` en minúsculas si lo
prefieres — el script normaliza ambos.)

Para generar el roster a partir de las fotos ya subidas, corre desde la raíz
del repo:

```bash
node scripts/seed-from-files.js
```

Esto escribe `sql/auto_seed.sql` listo para pegar en el SQL Editor de
Supabase (no toca la base de datos). Si prefieres que el script inserte
directo, usa `node scripts/seed-from-files.js --apply` (requiere
`NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`).

Si aún no tienes la foto de alguien, no subas nada: `/play` cae
automáticamente a un avatar generado (`lib/game/avatar.ts`) mientras tanto.
