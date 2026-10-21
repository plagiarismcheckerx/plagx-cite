/*!
 * Plagx Cite — a free academic writing utility by Plagiarism Checker X.
 * https://plagiarismcheckerx.com/ · MIT License
 */
export { styles, formatReference, formatBibliography, citeInText, sortReferences } from './format.js';
export { toBibTeX, parseBibTeX } from './bibtex.js';
export { normalizeDOI, isDOI, extractDOIs, lookupDOI, fromCrossref } from './doi.js';
export { findDuplicates } from './duplicates.js';
export { checkReferences } from './check.js';
