import { nameParts, familyName } from './names.js';
import { getDate, normalizeText } from './utils.js';

const TO_BIBTEX_TYPE = {
  'article-journal': 'article',
  'article-magazine': 'article',
  'article-newspaper': 'article',
  article: 'article',
  book: 'book',
  chapter: 'incollection',
  'paper-conference': 'inproceedings',
  report: 'techreport',
  thesis: 'phdthesis',
};

const FROM_BIBTEX_TYPE = {
  article: 'article-journal',
  book: 'book',
  inbook: 'chapter',
  incollection: 'chapter',
  inproceedings: 'paper-conference',
  conference: 'paper-conference',
  techreport: 'report',
  report: 'report',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  thesis: 'thesis',
  online: 'webpage',
};

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// ---------------------------------------------------------------- export

function escapeValue(value) {
  return String(value).replace(/[\\&%$#_{}]/g, (c) => (c === '\\' ? '\\textbackslash{}' : `\\${c}`));
}

function bibName(name) {
  const n = nameParts(name);
  if (n.literal) return `{${n.literal}}`;
  return [n.family, n.suffix, n.given].filter(Boolean).join(', ');
}

function baseKey(ref) {
  const lead = ref.author?.length ? familyName(ref.author[0]) : 'anon';
  const word = normalizeText(ref.title).split(' ').find((w) => w.length > 3 && !['with', 'from', 'that', 'this'].includes(w)) || '';
  const year = getDate(ref).year || '';
  return `${normalizeText(lead).replace(/ /g, '')}${year}${word}` || 'ref';
}

function entry(ref, key) {
  const type = TO_BIBTEX_TYPE[ref.type] || 'misc';
  const container = ref['container-title'];
  const d = getDate(ref);
  const fields = [
    ['author', ref.author?.length && ref.author.map(bibName).join(' and ')],
    ['editor', ref.editor?.length && ref.editor.map(bibName).join(' and ')],
    ['title', ref.title],
    [type === 'article' ? 'journal' : 'booktitle', ['article', 'incollection', 'inproceedings'].includes(type) && container],
    ['howpublished', type === 'misc' && container],
    ['year', d.year],
    ['month', d.month && MONTH_NAMES[d.month - 1]],
    ['volume', ref.volume],
    ['number', ref.issue],
    ['pages', ref.page && String(ref.page).replace(/\s*[-–—]+\s*/g, '--')],
    ['edition', ref.edition],
    [type === 'phdthesis' ? 'school' : type === 'techreport' ? 'institution' : 'publisher', ref.publisher],
    ['address', ref['publisher-place']],
    ['isbn', ref.ISBN],
    ['doi', ref.DOI],
    ['url', ref.URL],
  ].filter(([, value]) => value);

  const body = fields.map(([name, value]) => {
    const raw = name === 'author' || name === 'editor' || name === 'url' || name === 'doi' || name === 'month';
    return `  ${name} = {${raw ? value : escapeValue(value)}}`;
  });
  return `@${type}{${key},\n${body.join(',\n')}\n}`;
}

/** Converts one CSL-JSON reference or an array of them to BibTeX. */
export function toBibTeX(refs) {
  const list = Array.isArray(refs) ? refs : [refs];
  const used = new Set();
  return list.map((ref) => {
    let key = ref.id && /^[\w:.-]+$/.test(ref.id) ? String(ref.id) : baseKey(ref);
    if (used.has(key)) {
      let n = 0;
      while (used.has(key + String.fromCharCode(97 + n))) n += 1;
      key += String.fromCharCode(97 + n);
    }
    used.add(key);
    return entry(ref, key);
  }).join('\n\n');
}

// ---------------------------------------------------------------- import

const ACCENTS = { '"': '̈', "'": '́', '`': '̀', '^': '̂', '~': '̃', '=': '̄', '.': '̇', c: '̧', v: '̌', u: '̆', H: '̋' };

/** Converts common LaTeX markup to plain Unicode text. */
function cleanLatex(value) {
  return String(value)
    .replace(/\\([`'^"~=.])\s*\{?\\?([A-Za-z])\}?/g, (_, mark, letter) => letter + ACCENTS[mark])
    .replace(/\\([cvuH])\s*\{\\?([A-Za-z])\}/g, (_, mark, letter) => letter + ACCENTS[mark])
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\(?:emph|textit|textbf|textsc|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/(?<!\\)[{}]/g, '')
    .replace(/~/g, ' ')
    .replace(/\s+/g, ' ')
    .normalize('NFC')
    .trim();
}

function splitTopLevel(value, separator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < value.length; i += 1) {
    const c = value[i];
    if (c === '{') depth += 1;
    if (c === '}') depth -= 1;
    if (depth === 0 && separator.test(value.slice(i))) {
      const m = value.slice(i).match(separator);
      parts.push(current);
      current = '';
      i += m[0].length - 1;
      continue;
    }
    current += c;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseNames(value) {
  return splitTopLevel(value, /^\s+and\s+/i).map((raw) => {
    if (/^\{[^{}]*\}$/.test(raw)) return { literal: cleanLatex(raw.slice(1, -1)) };
    const parts = splitTopLevel(raw, /^,/).map(cleanLatex);
    if (parts.length === 3) return { family: parts[0], suffix: parts[1], given: parts[2] };
    if (parts.length === 2) return { family: parts[0], given: parts[1] };
    return nameParts(cleanLatex(raw));
  });
}

function findClose(src, start, open, close) {
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === open) depth += 1;
    else if (src[i] === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseFields(body, macros) {
  const fields = {};
  let i = 0;
  const skip = () => { while (i < body.length && /[\s,]/.test(body[i])) i += 1; };

  while (i < body.length) {
    skip();
    const name = /^[^\s=,{}]+/.exec(body.slice(i));
    if (!name) break;
    i += name[0].length;
    while (/\s/.test(body[i])) i += 1;
    if (body[i] !== '=') break;
    i += 1;

    let value = '';
    for (;;) {
      while (/\s/.test(body[i])) i += 1;
      if (body[i] === '{') {
        const end = findClose(body, i, '{', '}');
        value += body.slice(i + 1, end);
        i = end + 1;
      } else if (body[i] === '"') {
        let depth = 0;
        let j = i + 1;
        for (; j < body.length; j += 1) {
          if (body[j] === '{') depth += 1;
          else if (body[j] === '}') depth -= 1;
          else if (body[j] === '"' && depth === 0 && body[j - 1] !== '\\') break;
        }
        value += body.slice(i + 1, j);
        i = j + 1;
      } else {
        const token = /^[^\s,#}]+/.exec(body.slice(i));
        if (!token) break;
        value += macros[token[0].toLowerCase()] ?? token[0];
        i += token[0].length;
      }
      while (/\s/.test(body[i])) i += 1;
      if (body[i] !== '#') break;
      i += 1;
    }
    fields[name[0].toLowerCase()] = value;
  }
  return fields;
}

function toCSL(type, key, fields) {
  const ref = { id: key, type: FROM_BIBTEX_TYPE[type] || (fields.url ? 'webpage' : 'document') };
  const text = (name) => (fields[name] ? cleanLatex(fields[name]) : undefined);

  if (fields.author) ref.author = parseNames(fields.author);
  if (fields.editor) ref.editor = parseNames(fields.editor);
  if (fields.title) ref.title = text('title');
  const container = text('journal') || text('journaltitle') || text('booktitle') || text('howpublished');
  if (container) ref['container-title'] = container;

  const date = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/.exec(fields.date || '');
  const year = date ? date[1] : /\d{4}/.exec(fields.year || '')?.[0];
  if (year) {
    let month = date?.[2] || fields.month;
    if (month && !/^\d+$/.test(month)) month = MONTH_NAMES.indexOf(month.toLowerCase().slice(0, 3)) + 1;
    const parts = [Number(year)];
    if (Number(month) > 0) parts.push(Number(month));
    if (date?.[3]) parts.push(Number(date[3]));
    ref.issued = { 'date-parts': [parts] };
  }

  if (fields.volume) ref.volume = text('volume');
  if (fields.number) ref.issue = text('number');
  if (fields.pages) ref.page = text('pages').replace(/\s*-+\s*/g, '-');
  if (fields.edition) ref.edition = text('edition');
  const publisher = text('publisher') || text('school') || text('institution') || text('organization');
  if (publisher) ref.publisher = publisher;
  if (fields.address || fields.location) ref['publisher-place'] = text('address') || text('location');
  if (fields.isbn) ref.ISBN = text('isbn');
  if (fields.doi) ref.DOI = fields.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  if (fields.url) ref.URL = fields.url.trim();
  if (type === 'phdthesis') ref.genre = 'Doctoral dissertation';
  if (type === 'mastersthesis') ref.genre = 'Master’s thesis';
  return ref;
}

/** Parses BibTeX/BibLaTeX text into an array of CSL-JSON references. */
export function parseBibTeX(source) {
  const src = String(source);
  const macros = Object.fromEntries(MONTH_NAMES.map((m, i) => [m, String(i + 1)]));
  const refs = [];
  let i = 0;

  for (;;) {
    const at = src.indexOf('@', i);
    if (at < 0) break;
    const head = /^@\s*([A-Za-z]+)\s*([{(])/.exec(src.slice(at));
    if (!head) { i = at + 1; continue; }
    const type = head[1].toLowerCase();
    const openIndex = at + head[0].length - 1;
    const open = head[2];
    const end = findClose(src, openIndex, open, open === '{' ? '}' : ')');
    if (end < 0) break;
    const body = src.slice(openIndex + 1, end);
    i = end + 1;

    if (type === 'comment' || type === 'preamble') continue;
    if (type === 'string') {
      Object.assign(macros, Object.fromEntries(
        Object.entries(parseFields(body, macros)).map(([k, v]) => [k, v]),
      ));
      continue;
    }

    const comma = body.indexOf(',');
    const key = (comma < 0 ? body : body.slice(0, comma)).trim();
    const fields = comma < 0 ? {} : parseFields(body.slice(comma + 1), macros);
    refs.push(toCSL(type, key, fields));
  }
  return refs;
}
