#!/usr/bin/env node
// ============================================================================
// Genera el roster de `players` a partir de las fotos ya subidas en
// public/avatars/<slug-departamento>/<nombre_apellido>.jpg.
//
// Uso:
//   node scripts/seed-from-files.js            -> escribe sql/auto_seed.sql
//                                                  (para pegar en el SQL
//                                                  Editor de Supabase, no
//                                                  toca la base de datos)
//   node scripts/seed-from-files.js --apply    -> inserta directo en
//                                                  Supabase con la
//                                                  service_role key de
//                                                  .env.local
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const AVATARS_DIR = path.join(ROOT, "public", "avatars");
const OUT_SQL = path.join(ROOT, "sql", "auto_seed.sql");

// Debe coincidir con lib/game/departments.ts / teams.slug.
const KNOWN_DEPARTMENTS = [
  { slug: "realizacion", name: "Realización" },
  { slug: "finanzas_admin", name: "Finanzas & Administración" },
  { slug: "creatividad", name: "Creatividad" },
  { slug: "produccion", name: "Producción" },
  { slug: "comerciales", name: "Comerciales" },
];

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Conectores en minúscula si no son la primera palabra ("Leonardo de Jesus").
const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "los", "y"]);

// Soporta tanto "juan_perez.jpg" -> "Juan Perez" como "María Paula Arrubla
// Giraldo.png" -> "María Paula Arrubla Giraldo" (espacios, mayúsculas y
// tildes ya puestas en el archivo se respetan).
function cleanName(filename) {
  const base = filename.replace(IMAGE_EXT, "").trim();
  const words = base.split(/[\s_-]+/).filter(Boolean);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

function collectRoster() {
  if (!fs.existsSync(AVATARS_DIR)) {
    throw new Error(`No existe ${AVATARS_DIR}. Corre esto desde la raíz del repo.`);
  }

  const foundDirs = fs
    .readdirSync(AVATARS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const knownSlugs = new Set(KNOWN_DEPARTMENTS.map((d) => d.slug));
  for (const dir of foundDirs) {
    if (!knownSlugs.has(dir)) {
      console.warn(`⚠ Ignorando public/avatars/${dir}/ — no coincide con ningún slug de departamento conocido.`);
    }
  }

  const rows = [];
  for (const dept of KNOWN_DEPARTMENTS) {
    const deptDir = path.join(AVATARS_DIR, dept.slug);
    if (!fs.existsSync(deptDir)) {
      console.warn(`⚠ No existe public/avatars/${dept.slug}/ — se omite ${dept.name}.`);
      continue;
    }

    const files = fs
      .readdirSync(deptDir)
      .filter((f) => IMAGE_EXT.test(f))
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      console.warn(`⚠ public/avatars/${dept.slug}/ no tiene fotos todavía.`);
    }

    for (const file of files) {
      rows.push({
        department_slug: dept.slug,
        department_name: dept.name,
        name: cleanName(file),
        // encodeURIComponent: los nombres de archivo reales traen espacios y
        // tildes, que no son válidos sin escapar dentro de una URL.
        avatar_url: `/avatars/${dept.slug}/${encodeURIComponent(file)}`,
      });
    }
  }
  return rows;
}

function writeSqlFile(rows) {
  const byDept = new Map();
  for (const row of rows) {
    if (!byDept.has(row.department_slug)) byDept.set(row.department_slug, []);
    byDept.get(row.department_slug).push(row);
  }

  const blocks = [];
  for (const dept of KNOWN_DEPARTMENTS) {
    const deptRows = byDept.get(dept.slug) ?? [];
    if (deptRows.length === 0) continue;
    const lines = deptRows.map(
      (r, i) =>
        `  ('${r.department_slug}', '${sqlEscape(r.name)}', '${sqlEscape(r.avatar_url)}')` +
        (i === deptRows.length - 1 ? "" : ",")
    );
    blocks.push(`  -- ---- ${dept.name} (${deptRows.length} personas) -> public/avatars/${dept.slug}/\n${lines.join("\n")}`);
  }

  const sql = `-- ============================================================================
-- Auto-generado por scripts/seed-from-files.js a partir de las fotos en
-- public/avatars/<slug-departamento>/ — NO editar a mano, vuelve a correr
-- el script si cambian las fotos. Generado: ${new Date().toISOString()}
--
-- Corre esto una sola vez en el SQL Editor de Supabase. Si necesitas
-- regenerarlo después de agregar/renombrar fotos, primero borra las filas
-- ya cargadas (o vacía la tabla players) para no duplicar personas.
-- ============================================================================

insert into players (team_id, department_slug, name, avatar_url)
select t.id, v.dept_slug, v.name, v.avatar_url
from (values
${blocks.join(",\n\n")}
) as v(dept_slug, name, avatar_url)
join teams t on t.slug = v.dept_slug;
`;

  fs.writeFileSync(OUT_SQL, sql, "utf8");
  console.log(`✔ Escrito sql/auto_seed.sql con ${rows.length} personas. Pégalo en el SQL Editor de Supabase.`);
}

async function applyDirectly(rows) {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local (necesarios para --apply)."
    );
  }

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey);

  const { data: teams, error: teamsError } = await supabase.from("teams").select("id, slug");
  if (teamsError) throw teamsError;
  const teamIdBySlug = new Map(teams.map((t) => [t.slug, t.id]));

  const payload = [];
  for (const row of rows) {
    const teamId = teamIdBySlug.get(row.department_slug);
    if (!teamId) {
      console.warn(`⚠ No existe el equipo '${row.department_slug}' en la tabla teams — se omite ${row.name}.`);
      continue;
    }
    payload.push({
      team_id: teamId,
      department_slug: row.department_slug,
      name: row.name,
      avatar_url: row.avatar_url,
    });
  }

  const { error: insertError, count } = await supabase.from("players").insert(payload, { count: "exact" });
  if (insertError) throw insertError;
  console.log(`✔ Insertadas ${count ?? payload.length} personas directo en Supabase.`);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = collectRoster();

  if (rows.length === 0) {
    console.error("No se encontró ninguna foto en public/avatars/<slug>/. Nada que generar.");
    process.exit(1);
  }

  if (apply) {
    await applyDirectly(rows);
  } else {
    writeSqlFile(rows);
  }
}

main().catch((err) => {
  console.error("✖", err.message ?? err);
  process.exit(1);
});
