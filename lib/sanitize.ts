/**
 * Strips all HTML tags from a string to prevent stored XSS.
 * Returns the original value if it's not a string.
 */
export function stripHtml(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}
