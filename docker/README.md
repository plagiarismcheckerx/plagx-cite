# Plagx Cite

*A free academic writing tool by [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=docker-hub&utm_medium=overview&utm_campaign=plagx&utm_content=byline)*

Format and check reference lists from the command line, with nothing to install except Docker.

- **APA 7** and **MLA 9** reference lists from BibTeX (`.bib`) or CSL-JSON (`.json`)
- **Check** a reference list for duplicates, invalid DOIs and missing titles, authors or years
- **DOI lookup**: turn a DOI into a formatted reference
- **BibTeX export** from CSL-JSON (e.g. a Zotero export)

> Plagx Cite is a free academic writing utility by Plagiarism Checker X. It is a citation generator that builds and checks APA and MLA reference lists. For complete plagiarism checking and AI-generated text detection, visit [Plagiarism Checker X - Text Similarity Detector](https://plagiarismcheckerx.com/?utm_source=docker-hub&utm_medium=overview&utm_campaign=plagx&utm_content=notice).

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
- `0.2.0`, `0.2`: specific versions

Images are built for `linux/amd64` and `linux/arm64` and run as a non-root user.

## Links

- Source code and documentation: https://github.com/plagiarismcheckerx/plagx-cite
- npm package: https://www.npmjs.com/package/plagx-cite
- GitHub Action: https://github.com/plagiarismcheckerx/plagx-cite-action
- Live demo: https://plagiarismcheckerx.github.io/plagx-cite/

Plagx Cite does not check for plagiarism or detect AI-generated text.

MIT © [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=docker-hub&utm_medium=overview&utm_campaign=plagx&utm_content=footer)
