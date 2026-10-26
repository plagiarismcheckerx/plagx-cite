# Plagx Cite

*A free academic writing tool by Plagiarism Checker X.*

**Plagx Cite is a free, open-source citation generator and reference checker.** It turns sources into correct APA 7 and MLA 9 references and in-text citations, so students and researchers can build a clean reference list in seconds. It also checks the list for duplicate references, broken DOIs and missing details before you submit.

Use it as an **APA citation generator** or **MLA citation generator**: create a **reference list, bibliography or works cited** page, generate **in-text citations**, turn a **DOI into a citation**, import and export **BibTeX**, and find **duplicate references**.

- No dependencies, about 20 KB of plain JavaScript
- Works in Node.js 18+, modern browsers, Deno and Bun
- Uses [CSL-JSON](https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html), the reference format used by Zotero, Mendeley and Crossref
- Plain text, HTML or Markdown output
- TypeScript types included

**[Try the live demo →](https://plagiarismcheckerx.github.io/plagx-cite/)** · [Open in Observable](https://observablehq.com/@plagiarismcheckerx/plagx-cite)

Developer downloads: [npm](https://www.npmjs.com/package/plagx-cite) · [jsDelivr](https://www.jsdelivr.com/package/npm/plagx-cite) · [Docker Hub](https://hub.docker.com/r/plagiarismcheckerx/plagx-cite) · [GitHub Marketplace](https://github.com/marketplace/actions/plagx-cite-reference-check) · [GitLab](https://gitlab.com/plagiarism-checker-x/plagx-cite)

Need a quick citation online? Use the [free citation generator](https://plagiarismcheckerx.com/citation-generator?utm_source=plagx-cite&utm_medium=readme&utm_campaign=plagx&utm_content=citation-generator).

> Plagx Cite is a free academic writing utility by Plagiarism Checker X. It is a citation generator that builds and checks APA and MLA reference lists. Plagiarism checking and AI-generated text detection are available in Plagiarism Checker X, linked at the end of this page.

## Install

```bash
npm install plagx-cite
```

Plagx Cite is an ES module. Load it with `import`. `require('plagx-cite')` also works on Node.js 20.19+, 22.12+ and 23+.

Or load it in a browser with no install:

```html
<script type="module">
  import { formatReference } from 'https://cdn.jsdelivr.net/npm/plagx-cite@0.2.1/src/index.js';
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

### Checking a reference list

```js
import { checkReferences } from 'plagx-cite';

const result = await checkReferences(refs, { checkDOIs: true });
// { references: 4, errors: 2, warnings: 1, issues: [{ level: 'error', code: 'duplicate', ref: 'smith2020b', ... }] }
```

Errors are duplicates, invalid DOIs and DOIs that can't be found (with `checkDOIs`). Warnings are missing titles, authors or years.

## Command line

```bash
npx plagx-cite format references.bib --style apa
npx plagx-cite check references.bib --check-dois
npx plagx-cite doi 10.1038/nature14539 --style mla
npx plagx-cite bibtex references.json > references.bib
```

| Command | What it does |
|---|---|
| `format <file>` | Prints the formatted reference list (`--style apa\|mla`, `--format text\|html\|markdown`) |
| `check <file>` | Reports duplicates, invalid DOIs and missing fields (`--check-dois`, `--strict`, `--json`) |
| `doi <doi> [...]` | Looks up DOIs and prints formatted references |
| `bibtex <file>` | Converts a CSL-JSON or BibTeX file to BibTeX |

`<file>` is a `.bib` or CSL-JSON `.json` file, or `-` for stdin. Exit codes: `0` OK, `1` problems found, `2` usage or input error.

The same commands are also available as a [GitHub Action](https://github.com/plagiarismcheckerx/plagx-cite-action) and a [Docker image](https://hub.docker.com/r/plagiarismcheckerx/plagx-cite).

## Good to know

- Titles are used exactly as you give them. APA wants sentence case for article and book titles, and MLA wants title case. Plagx Cite does not change capitalisation automatically, because doing so would break names and acronyms.
- The output follows the main APA 7 and MLA 9 rules for common reference types. Always check the final list against your institution's or publisher's guidelines.

## Development

```bash
npm test          # run the tests
npm run docs      # copy the library into docs/ for the demo page
```

<h2>Plagx Cite - Free Citation & Reference Toolkit</h2>

<p>
 An open-source citation utility for students, researchers and developers.
 Format references, organize citations and manage bibliographies.
 </p>

<p>
 Developed by Plagiarism Checker X.
 </p>

<p>
 Plagx Cite helps with source attribution; it does not detect plagiarism
 or AI-generated text. For full document checks, explore
 <a href="https://plagiarismcheckerx.com/?utm_source=plagx-cite&utm_medium=readme&utm_campaign=plagx&utm_content=about-cta">Plagiarism Checker X</a>
 and its
 <a href="https://plagiarismcheckerx.com/ai-content-detector?utm_source=plagx-cite&utm_medium=readme&utm_campaign=plagx&utm_content=about-ai-detector">AI Content Detector</a>.
 </p>

## License

MIT © Plagiarism Checker X
