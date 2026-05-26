// Render a name as 1–2 letter initials (first letter, or first+last). Ported
// from design/atoms.jsx.
export function initials(name: string | undefined | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return ((parts[0][0] ?? '') + (last[0] ?? '')).toUpperCase();
}
