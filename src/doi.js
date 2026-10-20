const DOI_PATTERN = /10\.\d{4,9}\/[^\s"'<>]+/gi;
const PREFIX = /^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i;

function trimTrailing(doi) {
  let s = doi.replace(/[.,;:]+$/, '');
  // Drop a closing bracket that has no opening partner inside the DOI.
  while (/[)\]]$/.test(s)) {
    const close = s.at(-1);
    const open = close === ')' ? '(' : '[';
    if (s.split(open).length >= s.split(close).length) break;
    s = s.slice(0, -1).replace(/[.,;:]+$/, '');
  }
  return s;
}

/** Returns a bare DOI ("10.xxxx/...") from a DOI, doi: string or doi.org URL, or null if invalid. */
export function normalizeDOI(input) {
  let s = String(input ?? '').trim().replace(PREFIX, '');
  try { s = decodeURIComponent(s); } catch { /* keep as is */ }
  const match = /^10\.\d{4,9}\/\S+$/.exec(s);
  return match ? trimTrailing(match[0]) : null;
}

export function isDOI(input) {
  return normalizeDOI(input) !== null;
}

/** Finds every DOI in a block of text (unique, in order of appearance). */
export function extractDOIs(text) {
  const seen = new Set();
  const found = [];
  for (const m of String(text ?? '').matchAll(DOI_PATTERN)) {
    const doi = trimTrailing(m[0]);
    const key = doi.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      found.push(doi);
    }
  }
  return found;
}

const CROSSREF_TYPES = {
  'journal-article': 'article-journal',
  book: 'book',
  monograph: 'book',
  'edited-book': 'book',
  'reference-book': 'book',
  'book-chapter': 'chapter',
  'book-section': 'chapter',
  'book-part': 'chapter',
  'reference-entry': 'entry-encyclopedia',
  'proceedings-article': 'paper-conference',
  report: 'report',
  dissertation: 'thesis',
  'posted-content': 'article',
  dataset: 'dataset',
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Metadata often contains HTML/JATS markup and entities; returns plain text. */
function cleanText(value) {
  if (value == null || value === '') return undefined;
  return String(value)
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim() || undefined;
}

function cleanNames(list) {
  if (!Array.isArray(list) || !list.length) return undefined;
  return list.map((a) => (a.family
    ? { family: cleanText(a.family), given: cleanText(a.given) || '' }
    : { literal: cleanText(a.name || a.literal) || '' }));
}

const list = (v) => (Array.isArray(v) ? v : [v]).map(cleanText).filter(Boolean);

function withSubtitle(title, subtitle) {
  if (!title || !subtitle || title.toLowerCase().includes(subtitle.toLowerCase())) return title;
  return /[:?!]$/.test(title) ? `${title} ${subtitle}` : `${title}: ${subtitle}`;
}

/** Maps a Crossref "work" record to CSL-JSON. */
export function fromCrossref(work) {
  const type = CROSSREF_TYPES[work.type] || 'article';
  const issued = work.issued?.['date-parts']?.[0]?.[0] ? work.issued
    : work['published-print'] || work['published-online'] || work.created;
  // For chapters and proceedings Crossref may list [series, book]; the book is last.
  const containers = list(work['container-title']);
  const ref = {
    id: work.DOI,
    type,
    title: withSubtitle(list(work.title)[0], list(work.subtitle)[0]),
    author: cleanNames(work.author),
    editor: cleanNames(work.editor),
    'container-title': ['chapter', 'paper-conference'].includes(type) ? containers.at(-1) : containers[0],
    issued: issued?.['date-parts'] ? { 'date-parts': [issued['date-parts'][0].filter((n) => n != null)] } : undefined,
    volume: work.volume,
    issue: work.issue,
    page: work.page,
    publisher: cleanText(work.publisher),
    'publisher-place': cleanText(work['publisher-location']),
    ISBN: list(work.ISBN)[0],
    DOI: work.DOI,
    URL: work.URL,
  };
  if (type === 'thesis' && work.institution?.[0]?.name) ref.publisher = cleanText(work.institution[0].name);
  return Object.fromEntries(Object.entries(ref).filter(([, v]) => v !== undefined && v !== ''));
}

/** Keeps the CSL-JSON fields Plagx Cite uses from doi.org content negotiation (DataCite, arXiv, mEDRA…). */
function fromCSL(data) {
  const ref = {
    id: data.DOI,
    type: data.type || 'article',
    title: list(data.title)[0],
    author: cleanNames(data.author),
    editor: cleanNames(data.editor),
    'container-title': list(data['container-title'])[0],
    issued: data.issued?.['date-parts'] ? { 'date-parts': [data.issued['date-parts'][0].filter((n) => n != null)] } : undefined,
    volume: data.volume,
    issue: data.issue,
    page: data.page,
    publisher: cleanText(data.publisher),
    DOI: data.DOI,
    URL: data.URL,
  };
  return Object.fromEntries(Object.entries(ref).filter(([, v]) => v !== undefined && v !== ''));
}

/**
 * Looks up a DOI and returns CSL-JSON. Tries the public Crossref API first, then
 * doi.org content negotiation (covers DataCite DOIs such as arXiv and Zenodo).
 * Needs network access. Pass `mailto` to use Crossref's polite pool.
 */
export async function lookupDOI(input, { fetch: fetchFn = globalThis.fetch, mailto, signal } = {}) {
  const doi = normalizeDOI(input);
  if (!doi) throw new Error(`Not a valid DOI: "${input}"`);
  if (typeof fetchFn !== 'function') throw new Error('No fetch() available; pass one in options.fetch');

  let url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  if (mailto) url += `?mailto=${encodeURIComponent(mailto)}`;
  const res = await fetchFn(url, { signal, headers: { Accept: 'application/json' } });
  if (res.ok) return fromCrossref((await res.json()).message);
  if (res.status !== 404) throw new Error(`DOI lookup failed (${res.status}) for ${doi}`);

  const fallback = await fetchFn(`https://doi.org/${encodeURI(doi)}`, {
    signal, headers: { Accept: 'application/vnd.citationstyles.csl+json' },
  });
  if (fallback.status === 404) throw new Error(`DOI not found: ${doi}`);
  if (!fallback.ok) throw new Error(`DOI lookup failed (${fallback.status}) for ${doi}`);
  return fromCSL(await fallback.json());
}
