/**
 * Converts text into a clean, URL-friendly slug.
 * Example: "Tiara Cristal & Perlas!" -> "tiara-cristal-perlas"
 *
 * @param {string} text - Raw input string
 * @returns {string} Sanitized slug string
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents and diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with a hyphen
    .replace(/-+/g, '-'); // Collapse multiple hyphens
}
