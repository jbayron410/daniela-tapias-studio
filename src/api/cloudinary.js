// ============================================
// Utilidades para construir URLs de Cloudinary
// ============================================

// Base de Cloudinary (cloud name) configurada en el .env
const CLOUDINARY_BASE_URL =
  import.meta.env.VITE_CLOUDINARY_BASE_URL ||
  import.meta.env.CLOUDINARY_BASE_URL;

/**
 * Cloudinary reemplaza los caracteres `[` y `]` por `_` en los public id.
 * Por ejemplo:
 *   2024-08-20_10-48-58_[C-5bgaiAcKk].jpg
 *     -> 2024-08-20_10-48-58__C-5bgaiAcKk.jpg
 *    (el `_` final justo antes de la extensión se elimina)
 *   2024-12-11_09-29-25_[DDcQOoexFHx]_01.jpg
 *     -> 2024-12-11_09-29-25__DDcQOoexFHx__01.jpg
 *
 * @param {string} publicId - public id de Cloudinary
 * @returns {string} public id normalizado
 */
export function normalizeCloudinaryId(publicId) {
  return publicId
    .replace(/\[/g, '_')
    .replace(/\]/g, '_')
    .replace(/_+(\.[a-zA-Z0-9]+)$/, '$1');
}

/**
 * Convierte una ruta local del portal (ej. /sociales/nombre.jpg)
 * en la URL completa de Cloudinary aplicando la normalización.
 * @param {string} localPath - Ruta local estilo `/categoria/archivo.jpg`
 * @returns {string} URL completa de Cloudinary
 */
export function toCloudinaryUrl(localPath) {
  if (!localPath) return localPath;
  if (/^https?:\/\//.test(localPath)) return localPath;

  const normalized = normalizeCloudinaryId(localPath);
  // Quita la barra inicial para construir: base + "/" + publicId
  const publicId = normalized.replace(/^\/+/, '');
  return `${CLOUDINARY_BASE_URL}/${publicId}`;
}

/**
 * Dado un conjunto de rutas locales, devuelve las mismas apuntando a Cloudinary.
 * @param {string[]} paths - Rutas locales
 * @returns {string[]} URLs de Cloudinary
 */
export function mapToCloudinary(paths) {
  return (paths || []).map(toCloudinaryUrl);
}