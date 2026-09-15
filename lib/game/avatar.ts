/**
 * Las fotos reales del roster viven en public/avatars/<slug-departamento>/
 * y su ruta se guarda en `players.avatar_url` al cargar el seed (ver
 * sql/seed_roster_example.sql). Cualquier jugador sin `avatar_url` propio, o
 * cuya foto todavía no se ha subido, recibe un avatar generado de forma
 * determinística a partir de su nombre — se ve igual en todas las pantallas
 * y no requiere backend adicional.
 */
export function getAvatarUrl(name: string, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl;
  const seed = encodeURIComponent(name.trim().toLowerCase());
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=00F2FE,4FACFE,00FF87`;
}
