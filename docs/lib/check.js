import { findDuplicates } from './duplicates.js';
import { normalizeDOI, lookupDOI } from './doi.js';
import { getYear } from './utils.js';

const label = (ref, i) => (ref.id ? `${ref.id}` : `#${i + 1}`);

/**
 * Checks a reference list and returns problems found.
 * Errors: duplicate references, invalid DOIs, DOIs not found (with checkDOIs).
 * Warnings: missing title, author or year.
 * With `checkDOIs: true` every DOI is looked up online (Crossref / doi.org).
 */
export async function checkReferences(refs, { checkDOIs = false, fetch, mailto } = {}) {
  const issues = [];
  const add = (level, code, index, message) => issues.push({ level, code, index, ref: label(refs[index], index), message });

  for (const group of findDuplicates(refs)) {
    const names = group.indexes.map((i) => label(refs[i], i)).join(', ');
    for (const i of group.indexes.slice(1)) {
      add('error', 'duplicate', i, `Possible duplicate (${group.reasons.join(' and ')} match) of ${names.split(', ')[0]}: ${names}`);
    }
  }

  refs.forEach((ref, i) => {
    if (!ref.title) add('warning', 'missing-title', i, 'No title');
    if (!ref.author?.length && !ref.editor?.length) add('warning', 'missing-author', i, 'No author or editor');
    if (!getYear(ref)) add('warning', 'missing-year', i, 'No year (will show as n.d.)');
    if (ref.DOI && !normalizeDOI(ref.DOI)) add('error', 'invalid-doi', i, `Invalid DOI "${ref.DOI}"`);
  });

  if (checkDOIs) {
    for (const [i, ref] of refs.entries()) {
      const doi = ref.DOI && normalizeDOI(ref.DOI);
      if (!doi) continue;
      try {
        await lookupDOI(doi, { fetch, mailto });
      } catch (err) {
        add('error', 'doi-not-found', i, err.message);
      }
    }
  }

  issues.sort((a, b) => a.index - b.index || (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
  return {
    references: refs.length,
    errors: issues.filter((x) => x.level === 'error').length,
    warnings: issues.filter((x) => x.level === 'warning').length,
    issues,
  };
}
