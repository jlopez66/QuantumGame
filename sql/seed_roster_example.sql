-- ============================================================================
-- Ejemplo de carga masiva del roster (OPCIONAL).
-- Reemplaza los nombres por los 60 integrantes reales antes de correrlo.
-- avatar_url puede dejarse en NULL: el cliente genera un avatar automático
-- con lib/game/avatar.ts (DiceBear) a partir del nombre.
-- device_id se deja en NULL a propósito: cada persona "reclama" su fila
-- tocando su nombre en /play desde su propio celular.
-- ============================================================================

insert into players (team_id, department_slug, name, avatar_url)
select t.id, t.slug, v.name, null
from (values
  ('realizacion', 'Ana Torres'),
  ('realizacion', 'Carlos Peña'),
  ('finanzas_admin', 'María Gómez'),
  ('finanzas_admin', 'Jorge Ríos'),
  ('creatividad', 'Laura Méndez'),
  ('creatividad', 'Andrés Silva'),
  ('produccion', 'Diana Castro'),
  ('produccion', 'Felipe Rojas'),
  ('comerciales', 'Sofía Vargas'),
  ('comerciales', 'Ricardo Nieto')
  -- ... agrega aquí el resto hasta completar los 60
) as v(dept_slug, name)
join teams t on t.slug = v.dept_slug;
