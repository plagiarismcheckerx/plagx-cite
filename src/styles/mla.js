// MLA 9th edition (common reference types).
import { nameParts, familyName } from '../names.js';
import { getDate, dot, pageRange, isPageRange, ordinal, link, MONTHS_MLA } from '../utils.js';

const QUOTED_TYPES = [
  'article-journal', 'article-magazine', 'article-newspaper', 'article',
  'chapter', 'paper-conference', 'webpage', 'entry-encyclopedia', 'entry-dictionary', 'post', 'post-weblog',
];

function natural(n) {
  return n.literal || [n.given, n.family].filter(Boolean).join(' ');
}

function authorList(list) {
  const names = list.map(nameParts);
  const [first] = names;
  let lead = first.literal || first.family;
  if (!first.literal && first.given) lead += `, ${first.given}`;
  if (!first.literal && first.suffix) lead += `, ${first.suffix}`;
  if (names.length === 1) return lead;
  if (names.length === 2) return `${lead}, and ${natural(names[1])}`;
  return `${lead}, et al.`;
}

function editorList(list) {
  const names = list.map(nameParts).map(natural);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} et al.`;
}

function dateText(ref) {
  const d = getDate(ref);
  return [d.day, d.month ? MONTHS_MLA[d.month - 1] : null, d.year].filter(Boolean).join(' ');
}

function pagesText(page) {
  return `${isPageRange(page) ? 'pp.' : 'p.'} ${pageRange(page, '-')}`;
}

export function reference(ref, f) {
  const type = ref.type || '';
  const parts = [];

  if (ref.author?.length) {
    const authors = authorList(ref.author);
    parts.push(f.t(authors + dot(authors)));
  }

  if (ref.title) {
    parts.push(QUOTED_TYPES.includes(type)
      ? f.t(`“${ref.title}${dot(ref.title)}”`)
      : f.i(ref.title) + f.t(dot(ref.title)));
  }

  // Container elements, separated by commas and closed with a period.
  const elements = [];
  if (ref['container-title']) elements.push(f.i(ref['container-title']));
  if (ref.editor?.length) elements.push(f.t(`edited by ${editorList(ref.editor)}`));
  if (ref.edition) elements.push(f.t(`${ordinal(ref.edition)} ed.`));
  if (ref.volume) elements.push(f.t(`vol. ${ref.volume}`));
  if (ref.issue) elements.push(f.t(`no. ${ref.issue}`));
  // Articles name their journal, not the publisher, unless there is no journal (e.g. arXiv preprints).
  if (ref.publisher && (!type.startsWith('article') || !ref['container-title'])) elements.push(f.t(ref.publisher));
  const date = dateText(ref);
  if (date) elements.push(f.t(date));
  if (ref.page) elements.push(f.t(pagesText(ref.page)));
  const url = link(ref);
  if (url) elements.push(f.t(url));

  if (elements.length) parts.push(elements.join(f.t(', ')) + f.t('.'));
  return parts.join(' ');
}

export function inText(ref, { page, narrative = false } = {}) {
  const names = (ref.author || []).map(familyName);
  let who;
  if (names.length === 0) who = `“${ref.title || 'Untitled'}”`;
  else if (names.length === 1) who = names[0];
  else if (names.length === 2) who = `${names[0]} and ${names[1]}`;
  else who = `${names[0]} et al.`;

  const pages = page ? pageRange(page, '-') : '';
  if (narrative) return pages ? `${who} (${pages})` : who;
  return `(${pages ? `${who} ${pages}` : who})`;
}
