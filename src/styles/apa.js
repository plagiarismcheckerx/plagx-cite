// APA 7th edition (common reference types).
import { nameParts, initials, familyName } from '../names.js';
import { getDate, getYear, dot, pageRange, isPageRange, ordinal, link, MONTHS } from '../utils.js';

const JOURNAL_TYPES = ['article-journal', 'article-magazine', 'article-newspaper', 'article'];
const CONTAINER_TYPES = ['chapter', 'paper-conference', 'entry-encyclopedia', 'entry-dictionary'];
const DATED_TYPES = ['webpage', 'article-newspaper', 'article-magazine', 'post', 'post-weblog'];

function authorName(name) {
  const n = nameParts(name);
  if (n.literal) return n.literal;
  let s = n.family;
  if (n.given) s += `, ${initials(n.given)}`;
  if (n.suffix) s += `, ${n.suffix}`;
  return s;
}

function authorList(list) {
  const names = list.map(authorName);
  if (names.length === 1) return names[0];
  if (names.length <= 20) return `${names.slice(0, -1).join(', ')}, & ${names.at(-1)}`;
  return `${names.slice(0, 19).join(', ')}, . . . ${names.at(-1)}`;
}

function editorList(list) {
  const names = list.map((name) => {
    const n = nameParts(name);
    if (n.literal) return n.literal;
    return n.given ? `${initials(n.given)} ${n.family}` : n.family;
  });
  let s;
  if (names.length === 1) s = names[0];
  else if (names.length === 2) s = names.join(' & ');
  else s = `${names.slice(0, -1).join(', ')}, & ${names.at(-1)}`;
  return `${s} (${names.length > 1 ? 'Eds.' : 'Ed.'})`;
}

function dateText(ref) {
  const d = getDate(ref);
  if (!d.year) return 'n.d.';
  let s = String(d.year);
  if (DATED_TYPES.includes(ref.type) && d.month) {
    s += `, ${MONTHS[d.month - 1]}`;
    if (d.day) s += ` ${d.day}`;
  }
  return s;
}

function titleText(ref, f) {
  const title = ref.title || '';
  if (!title) return '';
  const type = ref.type || '';
  const italic = !JOURNAL_TYPES.includes(type) && !CONTAINER_TYPES.includes(type);
  let s = italic ? f.i(title) : f.t(title);
  let note = '';
  if (ref.edition) note = ` (${ordinal(ref.edition)} ed.)`;
  if (type === 'thesis') note = ` [${ref.genre || 'Thesis'}${ref.publisher ? `, ${ref.publisher}` : ''}]`;
  if (note) return s + f.t(`${note}.`);
  return s + f.t(dot(title));
}

function sourceText(ref, f, authors) {
  const type = ref.type || '';
  const container = ref['container-title'];

  if (JOURNAL_TYPES.includes(type)) {
    // Preprints and similar have no journal; name the repository instead (e.g. arXiv).
    if (!container) return ref.publisher && ref.publisher !== authors ? f.t(`${ref.publisher}${dot(ref.publisher)}`) : '';
    let s = f.i(container);
    if (ref.volume) s += f.t(', ') + f.i(String(ref.volume));
    if (ref.issue) s += f.t(`(${ref.issue})`);
    if (ref.page) s += f.t(`, ${pageRange(ref.page)}`);
    return s + f.t('.');
  }

  if (CONTAINER_TYPES.includes(type)) {
    let s = f.t('In ');
    if (ref.editor?.length) s += f.t(`${editorList(ref.editor)}, `);
    if (container) s += f.i(container);
    if (ref.page) s += f.t(` (${isPageRange(ref.page) ? 'pp.' : 'p.'} ${pageRange(ref.page)})`);
    s += f.t('.');
    if (ref.publisher) s += f.t(` ${ref.publisher}${dot(ref.publisher)}`);
    return s;
  }

  if (type === 'thesis') return '';

  // Webpage: site name; book, report and others: publisher. Omitted when it repeats the author.
  const source = type === 'webpage' ? container : ref.publisher;
  if (!source || source === authors) return '';
  return f.t(`${source}${dot(source)}`);
}

export function reference(ref, f) {
  const authors = ref.author?.length ? authorList(ref.author) : '';
  const date = f.t(`(${dateText(ref)}).`);
  const title = titleText(ref, f);
  const parts = authors ? [f.t(authors + dot(authors)), date, title] : [title, date];
  parts.push(sourceText(ref, f, authors), f.t(link(ref)));
  return parts.filter(Boolean).join(' ');
}

export function inText(ref, { page, narrative = false } = {}) {
  const names = (ref.author || []).map(familyName);
  const and = narrative ? 'and' : '&';
  let detail = getYear(ref) || 'n.d.';
  if (page) detail += `, ${isPageRange(page) ? 'pp.' : 'p.'} ${pageRange(page)}`;

  // No author: the title stands in, and APA puts the comma inside the quotation marks.
  if (names.length === 0) {
    const title = ref.title || 'Untitled';
    return narrative ? `“${title}” (${detail})` : `(“${title},” ${detail})`;
  }

  let who;
  if (names.length === 1) who = names[0];
  else if (names.length === 2) who = `${names[0]} ${and} ${names[1]}`;
  else who = `${names[0]} et al.`;
  return narrative ? `${who} (${detail})` : `(${who}, ${detail})`;
}
