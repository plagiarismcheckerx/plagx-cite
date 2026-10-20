# Plagx Cite

*A free academic writing tool by [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=plagx-cite&utm_medium=readme&utm_campaign=plagx&utm_content=byline)*

Format references in **APA 7** and **MLA 9**, create in-text citations, import and export **BibTeX**, look up **DOIs**, and find **duplicate references**.

- No dependencies, about 20 KB of plain JavaScript
- Works in Node.js 18+, modern browsers, Deno and Bun
- Uses [CSL-JSON](https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html), the reference format used by Zotero, Mendeley and Crossref
- Plain text, HTML or Markdown output
- TypeScript types included

**[Try the live demo →](https://plagiarismcheckerx.github.io/plagx-cite/)**

> Plagx Cite is a free academic writing utility by Plagiarism Checker X. It formats and checks references only. It does **not** check for plagiarism or detect AI-generated text. To check complete documents for plagiarism and AI-generated text, visit [Plagiarism Checker X - Text Similarity Detector](https://plagiarismcheckerx.com/?utm_source=plagx-cite&utm_medium=readme&utm_campaign=plagx&utm_content=notice).

## Install

```bash
npm install plagx-cite
```

Plagx Cite is an ES module. Load it with `import`. `require('plagx-cite')` also works on Node.js 20.19+, 22.12+ and 23+.

Or load it in a browser with no install:

```html
<script type="module">
  import { formatReference } from 'https://cdn.jsdelivr.net/npm/plagx-cite@0.1.0/src/index.js';
</script>
```

## Quick start

```js
import { formatReference, citeInText } from 'plagx-cite';

const ref = {
  type: 'article-journal',
  title: 'Deep learning for text similarity',
  author: [{ family: 'Smith', given: 'John Allen' }, { family: 'Lee', given: 'Kate' }],
  issued: { 'date-parts': [[2020]] },
  'container-title': 'Journal of Academic Writing',
  volume: '12',
  issue: '3',
  page: '45-67',
  DOI: '10.1234/jaw.2020.045',
};

formatReference(ref);
// Smith, J. A., & Lee, K. (2020). Deep learning for text similarity. Journal of Academic Writing, 12(3), 45–67. https://doi.org/10.1234/jaw.2020.045

formatReference(ref, { style: 'mla' });
// Smith, John Allen, and Kate Lee. “Deep learning for text similarity.” Journal of Academic Writing, vol. 12, no. 3, 2020, pp. 45-67, https://doi.org/10.1234/jaw.2020.045.

citeInText(ref, { page: '50' });               // (Smith & Lee, 2020, p. 50)
citeInText(ref, { narrative: true });          // Smith and Lee (2020)
citeInText(ref, { style: 'mla', page: '50' }); // (Smith and Lee 50)
```

## API

### Formatting

| Function | Returns |
|---|---|
| `formatReference(ref, { style, format })` | One reference-list entry |
| `formatBibliography(refs, { style, format })` | Sorted array of entries |
| `citeInText(ref, { style, page, narrative })` | In-text citation |
| `sortReferences(refs)` | New array sorted by author, year, title |
| `styles` | `['apa', 'mla']` |

- `style`: `'apa'` (default) or `'mla'`
- `format`: `'text'` (default), `'html'` (titles in `<i>`, text escaped) or `'markdown'` (titles in `*…*`)

Supported reference types: `article-journal`, `article-magazine`, `article-newspaper`, `book`, `chapter`, `paper-conference`, `report`, `thesis`, `webpage`. Other types fall back to a sensible general layout.

### BibTeX

```js
import { toBibTeX, parseBibTeX } from 'plagx-cite';

toBibTeX([ref]);
// @article{smith2020deep,
//   author = {Smith, John Allen and Lee, Kate},
//   ...

const refs = parseBibTeX(fs.readFileSync('library.bib', 'utf8'));
```

`parseBibTeX` handles `@string` macros, `#` concatenation, common LaTeX accents (`{\"u}` → ü), organisation names in braces, and BibLaTeX `date` / `journaltitle` fields.

### DOIs

```js
import { lookupDOI, normalizeDOI, extractDOIs } from 'plagx-cite';

const ref = await lookupDOI('10.1038/nature14539', { mailto: 'you@example.com' });
formatReference(ref);

normalizeDOI('https://doi.org/10.1038/NATURE14539'); // '10.1038/NATURE14539'
extractDOIs(text);                                   // every DOI found in the text
```

`lookupDOI` calls the free public [Crossref API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/). If a DOI isn't registered with Crossref, such as arXiv or Zenodo DOIs from DataCite, it falls back to [doi.org content negotiation](https://citation.doi.org/). No API key is needed. Passing your email as `mailto` is optional and gives more reliable service. Your own `fetch` can be passed as `options.fetch`.

### Duplicate references

```js
import { findDuplicates } from 'plagx-cite';

findDuplicates(refs);
// [{ indexes: [0, 4], reasons: ['doi'] }, { indexes: [2, 7], reasons: ['title'] }]
```

References count as duplicates when they share a DOI, or the same title and first author. Case, accents and punctuation are ignored.

## Good to know

- Titles are used exactly as you give them. APA wants sentence case for article and book titles, and MLA wants title case. Plagx Cite does not change capitalisation automatically, because doing so would break names and acronyms.
- The output follows the main APA 7 and MLA 9 rules for common reference types. Always check the final list against your institution's or publisher's guidelines.

## Development

```bash
npm test          # run the tests
npm run docs      # copy the library into docs/ for the demo page
```

## About Plagiarism Checker X

Plagx Cite is made by [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=plagx-cite&utm_medium=readme&utm_campaign=plagx&utm_content=about), which builds tools for students, researchers, teachers and publishers. Plagx Cite helps with reference lists. To check a full paper for plagiarism and AI-generated text before you submit it, use the [Plagiarism Checker X - Text Similarity Detector](https://plagiarismcheckerx.com/?utm_source=plagx-cite&utm_medium=readme&utm_campaign=plagx&utm_content=about-cta).

## License

MIT © Plagiarism Checker X
