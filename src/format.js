import * as apa from './styles/apa.js';
import * as mla from './styles/mla.js';
import { familyName } from './names.js';
import { getYear, normalizeText } from './utils.js';

const STYLES = { apa, mla };

/** Names of the built-in citation styles. */
export const styles = Object.keys(STYLES);

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function formatter(format) {
  if (format === 'text') return { t: String, i: String };
  if (format === 'html') {
    const t = (s) => String(s).replace(/[&<>"]/g, (c) => HTML_ESCAPES[c]);
    return { t, i: (s) => `<i>${t(s)}</i>` };
  }
  if (format === 'markdown') {
    const t = (s) => String(s).replace(/([\\*_])/g, '\\$1');
    return { t, i: (s) => `*${t(s)}*` };
  }
  throw new Error(`Unknown output format "${format}". Use "text", "html" or "markdown".`);
}

function getStyle(name) {
  const style = STYLES[String(name).toLowerCase()];
  if (!style) throw new Error(`Unknown citation style "${name}". Available: ${styles.join(', ')}.`);
  return style;
}

/** Formats one CSL-JSON reference as a reference-list entry. */
export function formatReference(ref, { style = 'apa', format = 'text' } = {}) {
  return getStyle(style).reference(ref, formatter(format));
}

/** Sorts references and formats each one; returns an array of entries. */
export function formatBibliography(refs, options = {}) {
  return sortReferences(refs).map((ref) => formatReference(ref, options));
}

/** In-text citation, e.g. "(Smith & Lee, 2020, p. 4)" or "Smith and Lee (2020)". */
export function citeInText(ref, { style = 'apa', page, narrative = false } = {}) {
  return getStyle(style).inText(ref, { page, narrative });
}

function sortKey(ref) {
  const lead = ref.author?.length
    ? familyName(ref.author[0])
    : String(ref.title || '').replace(/^(a|an|the)\s+/i, '');
  return `${normalizeText(lead)} ${getYear(ref) || '0000'} ${normalizeText(ref.title)}`;
}

/** Returns a new array sorted by first author (or title), year, then title. */
export function sortReferences(refs) {
  return [...refs].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}
