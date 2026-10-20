import { familyName } from './names.js';
import { normalizeText } from './utils.js';
import { normalizeDOI } from './doi.js';

function keysFor(ref) {
  const keys = {};
  const doi = ref.DOI && normalizeDOI(ref.DOI);
  if (doi) keys.doi = doi.toLowerCase();
  const title = normalizeText(ref.title);
  if (title) {
    const lead = ref.author?.length ? normalizeText(familyName(ref.author[0])) : '';
    keys.title = `${title}|${lead}`;
  }
  return keys;
}

/**
 * Finds references that appear more than once, matched by DOI or by
 * normalized title + first author.
 * Returns [{ indexes: [0, 3], reasons: ['doi', 'title'] }, ...].
 */
export function findDuplicates(refs) {
  const keys = refs.map(keysFor);
  const parent = refs.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const firstSeen = new Map();

  keys.forEach((k, i) => {
    for (const [reason, value] of Object.entries(k)) {
      const id = `${reason}:${value}`;
      if (firstSeen.has(id)) parent[find(i)] = find(firstSeen.get(id));
      else firstSeen.set(id, i);
    }
  });

  const groups = new Map();
  refs.forEach((_, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) || []), i]);
  });

  return [...groups.values()]
    .filter((indexes) => indexes.length > 1)
    .map((indexes) => ({
      indexes,
      reasons: ['doi', 'title'].filter((reason) => {
        const values = indexes.map((i) => keys[i][reason]).filter(Boolean);
        return values.length > new Set(values).size;
      }),
    }));
}
