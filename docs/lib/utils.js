import { normalizeDOI } from './doi.js';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTHS_MLA = [
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June',
  'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
];

/** Returns { year, month, day } from a CSL `issued` date or a plain `year` field. */
export function getDate(ref) {
  const parts = ref?.issued?.['date-parts']?.[0];
  if (parts && parts[0]) {
    return { year: Number(parts[0]), month: parts[1] ? Number(parts[1]) : undefined, day: parts[2] ? Number(parts[2]) : undefined };
  }
  if (ref?.year) return { year: Number(ref.year) };
  return {};
}

export function getYear(ref) {
  const { year } = getDate(ref);
  return year ? String(year) : null;
}

/** Lowercase, strip accents and punctuation; used for comparisons and keys. */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function endsWithTerminal(value) {
  return /[.?!]["”’]?$/.test(String(value).trim());
}

/** Period to append unless the text already ends with terminal punctuation. */
export function dot(value) {
  return endsWithTerminal(value) ? '' : '.';
}

export function pageRange(page, dash = '–') {
  return String(page).trim().replace(/\s*[-–—]+\s*/g, dash);
}

export function isPageRange(page) {
  return /[-–—]/.test(String(page));
}

export function ordinal(value) {
  const n = Number(value);
  if (!Number.isInteger(n)) return String(value);
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
}

export function doiURL(doi) {
  return `https://doi.org/${doi}`;
}

/** Preferred link for a reference: a valid DOI first, then URL. */
export function link(ref) {
  const doi = ref.DOI && normalizeDOI(ref.DOI);
  if (doi) return doiURL(doi);
  return ref.URL || '';
}
