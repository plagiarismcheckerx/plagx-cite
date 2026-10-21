# Changelog

## 0.2.1: 2026-10-21

- README, npm description and keywords: clearer description of the citation generator, citation keywords, links to the Plagiarism Checker X citation generator, plagiarism checker and AI Content Detector
- No code changes

## 0.2.0: 2026-10-20

- New `plagx-cite` command line: `format`, `check`, `doi` and `bibtex`
- New `checkReferences()`: finds duplicates, invalid DOIs, DOIs that can't be found, and missing titles, authors or years
- Fix: an invalid DOI is no longer printed as a link, and a DOI given as a full `https://doi.org/` URL is not doubled

## 0.1.0 — 2026-10-19

First release.

- APA 7 and MLA 9 reference formatting for journal articles, books, chapters, conference papers, reports, theses and web pages
- In-text citations (parenthetical and narrative)
- Plain text, HTML and Markdown output
- BibTeX export and BibTeX/BibLaTeX import
- DOI normalising, extraction from text, and lookup through the public Crossref API, with a doi.org fallback for DataCite DOIs (arXiv, Zenodo)
- Duplicate reference detection by DOI or title + first author
