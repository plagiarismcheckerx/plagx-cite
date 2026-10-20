/**
 * Accepts a CSL name object ({ family, given, suffix } or { literal })
 * or a string ("Smith, John" / "John Smith") and returns a CSL name object.
 */
export function nameParts(name) {
  if (typeof name === 'string') return parseNameString(name);
  if (!name) return { family: '', given: '' };
  if (name.literal) return { literal: name.literal };
  return { family: name.family || '', given: name.given || '', suffix: name.suffix };
}

function parseNameString(value) {
  const s = value.trim();
  if (s.includes(',')) {
    const [family, ...rest] = s.split(',');
    return { family: family.trim(), given: rest.join(',').trim() };
  }
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { family: s, given: '' };
  const family = parts.pop();
  return { family, given: parts.join(' ') };
}

/** "John Ronald" -> "J. R.", "J.R.R." -> "J. R. R.", "Jean-Paul" -> "J.-P." */
export function initials(given) {
  return String(given)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const dotted = part.match(/\p{L}\./gu);
      if (dotted && dotted.join('') === part) return dotted.map((d) => d.toUpperCase()).join(' ');
      return part
        .split('-')
        .filter(Boolean)
        .map((seg) => `${seg[0].toUpperCase()}.`)
        .join('-');
    })
    .join(' ');
}

/** Family name (or literal) used for in-text citations and sorting. */
export function familyName(name) {
  const n = nameParts(name);
  return n.literal || n.family;
}
