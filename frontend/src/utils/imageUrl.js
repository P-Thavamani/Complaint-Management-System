/**
 * Resolves an image URL from the complaint system to an absolute URL.
 *
 * Handles three cases:
 *  1. Already absolute (http/https) - return as-is
 *  2. New MongoDB API route:  /api/chatbot/image/<id>  → http://localhost:5000/api/chatbot/image/<id>
 *  3. Old filesystem route:   /static/uploads/<file>   → http://localhost:5000/static/uploads/<file>
 */
const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path — prepend backend base
  return `${BACKEND}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default resolveImageUrl;
