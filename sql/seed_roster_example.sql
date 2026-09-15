-- ============================================================================
-- Carga masiva del roster precargado (obligatoria: ya no hay auto-registro
-- en /play — cada persona solo puede tocar su nombre en la lista de su
-- departamento). Reemplaza los nombres de cada bloque VALUES por los 60
-- integrantes reales antes de correrlo en el SQL Editor de Supabase.
--
-- Fotos: sube cada foto a public/avatars/<slug-departamento>/ en el repo con
-- el archivo nombrado a partir del nombre completo, en minúsculas, sin
-- acentos/ñ normalizada y con espacios reemplazados por "_":
--   "María Gómez"   -> public/avatars/finanzas_admin/maria_gomez.jpg
--   "Andrés Silva"  -> public/avatars/creatividad/andres_silva.jpg
-- Este INSERT genera avatar_url con esa misma regla (usando la extensión
-- unaccent) como '/avatars/<slug_departamento>/nombre_apellido.jpg', así que
-- basta con escribir el nombre tal cual una sola vez acá y subir la foto con
-- el nombre de archivo que indican los comentarios de arriba — no hay que
-- escribir la ruta a mano ni mantenerla sincronizada.
--
-- Si a alguien todavía no le tienes foto, no subas el archivo: /play cae
-- automáticamente a un avatar generado (ver lib/game/avatar.ts) hasta que
-- la subas.
-- ============================================================================

create extension if not exists unaccent;

insert into players (team_id, department_slug, name, avatar_url)
select
  t.id,
  t.slug,
  v.name,
  '/avatars/' || t.slug || '/'
    || regexp_replace(lower(unaccent(v.name)), '[^a-z0-9]+', '_', 'g')
    || '.jpg'
from (values
  -- ---- Realización -> public/avatars/realizacion/ -------------------------
  ('realizacion', 'Ana Torres'),
  ('realizacion', 'Carlos Peña'),
  -- ... agrega aquí el resto de Realización

  -- ---- Finanzas & Administración -> public/avatars/finanzas_admin/ --------
  ('finanzas_admin', 'María Gómez'),
  ('finanzas_admin', 'Jorge Ríos'),
  -- ... agrega aquí el resto de Finanzas & Administración

  -- ---- Creatividad -> public/avatars/creatividad/ --------------------------
  ('creatividad', 'Laura Méndez'),
  ('creatividad', 'Andrés Silva'),
  -- ... agrega aquí el resto de Creatividad

  -- ---- Producción -> public/avatars/produccion/ ----------------------------
  ('produccion', 'Diana Castro'),
  ('produccion', 'Felipe Rojas'),
  -- ... agrega aquí el resto de Producción

  -- ---- Comerciales -> public/avatars/comerciales/ --------------------------
  ('comerciales', 'Sofía Vargas'),
  ('comerciales', 'Ricardo Nieto')
  -- ... agrega aquí el resto de Comerciales
) as v(dept_slug, name)
join teams t on t.slug = v.dept_slug;
