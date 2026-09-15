/**
 * No hay infraestructura de subida de fotos (Supabase Storage) en este
 * proyecto todavía. Mientras tanto, cualquier jugador sin `avatar_url` propio
 * recibe un avatar generado de forma determinística a partir de su nombre —
 * se ve igual en todas las pantallas y no requiere backend adicional.
 * Si más adelante quieres fotos reales, sube el archivo a un bucket público
 * de Supabase Storage y guarda esa URL en `players.avatar_url`.
 */
export function getAvatarUrl(name: string, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl;
  const seed = encodeURIComponent(name.trim().toLowerCase());
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=00F2FE,4FACFE,00FF87`;
}
