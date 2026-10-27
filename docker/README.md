# Plagx Cite

*A free academic writing tool by Plagiarism Checker X.*

**Plagx Cite is a free, open-source citation generator and reference checker, packaged as a Docker image.** It turns BibTeX and CSL-JSON files into correct APA 7 and MLA 9 reference lists, bibliographies and works cited pages, and checks them for duplicate references, broken DOIs and missing details, with nothing to install except Docker.

- **APA citation generator** and **MLA citation generator** for BibTeX (`.bib`) or CSL-JSON (`.json`) files
- **Check** a reference list for duplicates, invalid DOIs and missing titles, authors or years
- **DOI to citation**: turn a DOI into a formatted reference
- **BibTeX export** from CSL-JSON (e.g. a Zotero export)

**[Try the live demo →](https://plagiarismcheckerx.github.io/plagx-cite/)**

Developer downloads: [Docker Hub](https://hub.docker.com/r/plagiarismcheckerx/plagx-cite) · [GitHub Marketplace](https://github.com/marketplace/actions/plagx-cite-reference-check) · [npm](https://www.npmjs.com/package/plagx-cite) · [PyPI](https://pypi.org/project/plagx-cite/) · [GitHub](https://github.com/plagiarismcheckerx/plagx-cite)

Need a quick citation online? Use the [free citation generator](https://plagiarismcheckerx.com/citation-generator?utm_source=plagx-cite-docker).

> Plagx Cite is a free academic writing utility by Plagiarism Checker X. It is a citation generator that builds and checks APA and MLA reference lists. Plagiarism checking and AI-generated text detection are available in Plagiarism Checker X, linked at the end of this page.

## Usage

Mount the folder with your reference files at `/data`:

```bash
# Formatted reference list (APA by default)
docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-cite format references.bib

# MLA, as Markdown
docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-cite format references.bib --style mla --format markdown

# Check for problems (exit code 1 if any are found), also verifying every DOI online
docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-cite check references.bib --check-dois

# Look up DOIs
docker run --rm plagiarismcheckerx/plagx-cite doi 10.1038/nature14539

# Convert CSL-JSON to BibTeX
docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-cite bibtex library.json > library.bib
```

On Windows PowerShell, use `-v "${PWD}:/data"`.

Run `docker run --rm plagiarismcheckerx/plagx-cite --help` for all options.

## Tags

- `latest`: newest release
- `0.2.2`, `0.2`: specific versions

Images are built for `linux/amd64` and `linux/arm64` and run as a non-root user.

## Links

- Source code and documentation: https://github.com/plagiarismcheckerx/plagx-cite
- npm package: https://www.npmjs.com/package/plagx-cite
- GitHub Action: https://github.com/marketplace/actions/plagx-cite-reference-check

## Plagx Cite - Free Citation & Reference Toolkit

An open-source citation utility for students, researchers and developers. Format references, organize citations and manage bibliographies.

Developed by Plagiarism Checker X.

Plagx Cite helps with source attribution; it does not detect plagiarism or AI-generated text. For full document checks, explore [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=plagx-cite-docker) and its [AI Content Detector](https://plagiarismcheckerx.com/ai-content-detector?utm_source=plagx-cite-docker).

MIT © Plagiarism Checker X
