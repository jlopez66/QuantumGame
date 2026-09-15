# QUANTUM Game Show — Brandex

Web-app tipo game show para el lanzamiento de QUANTUM. `/admin` = pantalla LED, `/play` = celulares.

## Levantar el proyecto en un computador nuevo

1. **Clonar e instalar**
   ```bash
   git clone https://github.com/jlopez66/QuantumGame.git
   cd QuantumGame
   npm install
   ```

2. **Variables de entorno** — copia el ejemplo y llena tus llaves de Supabase:
   ```bash
   cp .env.example .env.local
   ```
   Edita `.env.local` con:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase Dashboard → Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` → la misma pantalla, clave `service_role` (secreta, nunca la subas a git).
   - `NEXT_PUBLIC_SITE_URL` → `http://localhost:3000` en local, o la URL de Vercel en producción.

3. **Base de datos** (solo la primera vez en un proyecto Supabase nuevo):
   - Corre `sql/schema.sql` completo en el SQL Editor de Supabase.
   - Si el proyecto Supabase **ya tenía** el esquema anterior corriendo, corre en su lugar `sql/migration_002_roulette.sql` y luego `sql/migration_003_remove_self_register.sql`.
   - Obligatorio: `sql/seed_roster_example.sql` (con los nombres reales) para precargar el roster de jugadores — `/play` no tiene auto-registro, solo se puede reclamar un nombre ya cargado.
   - Sube las fotos del roster a `public/avatars/<slug-departamento>/` siguiendo la convención de `public/avatars/README.md` antes del evento.

4. **Correr en local**
   ```bash
   npm run dev
   ```
   - TV: http://localhost:3000/admin
   - Celulares: http://localhost:3000/play (o la URL de Vercel una vez desplegado, para que el QR del lobby funcione desde otros celulares).

5. **Deploy a Vercel**: importa el repo en Vercel, agrega las mismas variables de entorno del paso 2, y actualiza `NEXT_PUBLIC_SITE_URL` con el dominio final.
