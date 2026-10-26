# Plagx Cite – Observable notebook cells

Written for Observable Notebooks 2.0 (observablehq.com/d/…). Create a new notebook and add each cell below in order. Set each cell's type with the label at the cell's top right: **md** for Markdown cells, **js** for JavaScript cells. Paste only the text inside each code block.

---

### Cell 1 · md

```md
# Plagx Cite: Free APA & MLA Citation Generator

*A free academic writing tool by Plagiarism Checker X.*

Build a correctly formatted APA 7 or MLA 9 reference list with in-text citations. Look up a DOI, paste BibTeX, and spot duplicate references before you submit. Everything runs in your browser using the open-source [plagx-cite](https://www.npmjs.com/package/plagx-cite) package.

**[Try the full live demo →](https://plagiarismcheckerx.github.io/plagx-cite/)** · [Source code on GitHub](https://github.com/plagiarismcheckerx/plagx-cite)
```

### Cell 2 · js

```js
import * as cite from "npm:plagx-cite@0.2.1";
```

### Cell 3 · js

```js
const style = view(Inputs.radio(new Map([["APA 7", "apa"], ["MLA 9", "mla"]]), {label: "Citation style", value: "apa"}));
```

### Cell 4 · js

```js
const doi = view(Inputs.text({label: "DOI", placeholder: "e.g. 10.1038/nature14539", submit: "Look up"}));
```

### Cell 5 · js

```js
const bibtex = view(Inputs.textarea({
  label: "BibTeX",
  rows: 6,
  submit: "Import",
  value: `@book{booth2016,
  author = {Booth, Wayne C. and Colomb, Gregory G. and Williams, Joseph M.},
  title = {The craft of research},
  edition = {4},
  publisher = {University of Chicago Press},
  year = {2016}
}`
}));
```

### Cell 6 · js

```js
const lookupError = [];
const references = cite.parseBibTeX(bibtex);
if (doi.trim()) {
  try { references.push(await cite.lookupDOI(doi.trim())); }
  catch (err) { lookupError.push(err.message); }
}
```

### Cell 7 · js

```js
const sorted = cite.sortReferences(references);
const entries = cite.formatBibliography(sorted, {style, format: "html"});
const dupes = cite.findDuplicates(references);
const item = (ref, i) => {
  const p = html`<p style="padding-left: 2em; text-indent: -2em; margin: 0 0 12px"></p>`;
  p.innerHTML = entries[i];
  p.append(html`<br><small style="font-family: system-ui, sans-serif; color: #5d6470">In text: ${cite.citeInText(ref, {style})}</small>`);
  return p;
};
display(html`<div style="font-family: Georgia, serif; max-width: 760px">
  ${lookupError.map((m) => html`<p style="color: #a33">${m}</p>`)}
  ${dupes.map((g) => html`<p style="background: #fff4d6; color: #7a5600; padding: 8px 10px; border-radius: 6px">Possible duplicate (${g.reasons.join(" and ")} match): “${references[g.indexes[0]].title}” appears ${g.indexes.length} times.</p>`)}
  <h3>${style === "apa" ? "References" : "Works Cited"}</h3>
  ${sorted.length ? sorted.map(item) : html`<p>No references yet.</p>`}
</div>`);
```

### Cell 8 · js

```js
const bibFile = URL.createObjectURL(new Blob([cite.toBibTeX(sorted)], {type: "application/x-bibtex"}));
display(html`<a href="${bibFile}" download="references.bib">Download references.bib</a>`);
```

### Cell 9 · md

```md
## How it works

- **DOI lookup** uses the free public Crossref API, with a doi.org fallback for DataCite DOIs. No API key is needed.
- **BibTeX import** handles `@string` macros, LaTeX accents and BibLaTeX `date` / `journaltitle` fields.
- **Duplicates** are references with the same DOI, or the same title and first author.
- Titles are used exactly as you enter them: APA wants sentence case and MLA wants title case.

Use it in your own code:

~~~js
import {formatReference, citeInText} from "https://cdn.jsdelivr.net/npm/plagx-cite@0.2.1/+esm";
~~~

Developer downloads: [npm](https://www.npmjs.com/package/plagx-cite) · [PyPI](https://pypi.org/project/plagx-cite/) · [NuGet](https://www.nuget.org/packages/Plagx.Cite) · [Maven Central](https://central.sonatype.com/artifact/io.github.plagiarismcheckerx/plagx-cite) · [GitHub](https://github.com/plagiarismcheckerx/plagx-cite)

Need a quick citation for any style? Use the [free citation generator](https://plagiarismcheckerx.com/citation-generator?utm_source=plagx-cite-observable&utm_medium=notebook&utm_campaign=plagx&utm_content=citation-generator).

## Plagx Cite - Free Citation & Reference Toolkit

Developed by Plagiarism Checker X. Plagx Cite helps with source attribution; it does not detect plagiarism or AI-generated text. For full document checks, explore [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=plagx-cite-observable&utm_medium=notebook&utm_campaign=plagx&utm_content=about-cta) and its [AI Content Detector](https://plagiarismcheckerx.com/ai-content-detector?utm_source=plagx-cite-observable&utm_medium=notebook&utm_campaign=plagx&utm_content=about-ai-detector).

MIT License
```
