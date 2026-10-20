import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatReference, formatBibliography, citeInText, toBibTeX, parseBibTeX,
  normalizeDOI, extractDOIs, lookupDOI, fromCrossref, findDuplicates,
} from '../src/index.js';

const article = {
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

const book = {
  type: 'book',
  title: 'Writing research papers',
  author: [{ family: 'Brown', given: 'Mary' }],
  issued: { 'date-parts': [[2018]] },
  publisher: 'Academic Press',
  edition: '2',
};

const chapter = {
  type: 'chapter',
  title: 'Citing sources well',
  author: [{ family: 'Khan', given: 'Ali' }, { family: 'Ng', given: 'Wei' }, { family: 'Ruiz', given: 'Ana' }],
  editor: [{ family: 'Green', given: 'Paul' }, { family: 'White', given: 'Sara Jane' }],
  'container-title': 'Handbook of scholarly writing',
  page: '101-120',
  publisher: 'Routledge',
  issued: { 'date-parts': [[2019]] },
};

const webpage = {
  type: 'webpage',
  title: 'How to avoid plagiarism',
  author: [{ literal: 'Writing Centre' }],
  'container-title': 'University Library',
  issued: { 'date-parts': [[2023, 3, 15]] },
  URL: 'https://example.com/post',
};

test('APA 7 reference list entries', () => {
  assert.equal(formatReference(article),
    'Smith, J. A., & Lee, K. (2020). Deep learning for text similarity. Journal of Academic Writing, 12(3), 45–67. https://doi.org/10.1234/jaw.2020.045');
  assert.equal(formatReference(book), 'Brown, M. (2018). Writing research papers (2nd ed.). Academic Press.');
  assert.equal(formatReference(chapter),
    'Khan, A., Ng, W., & Ruiz, A. (2019). Citing sources well. In P. Green & S. J. White (Eds.), Handbook of scholarly writing (pp. 101–120). Routledge.');
  assert.equal(formatReference(webpage),
    'Writing Centre. (2023, March 15). How to avoid plagiarism. University Library. https://example.com/post');
});

test('APA without author or date puts title first and uses n.d.', () => {
  assert.equal(formatReference({ type: 'webpage', title: 'Citation basics', URL: 'https://example.com' }),
    'Citation basics. (n.d.). https://example.com');
});

test('APA lists 21+ authors as first 19, ellipsis, last', () => {
  const author = Array.from({ length: 22 }, (_, i) => ({ family: `A${i + 1}`, given: 'B' }));
  const out = formatReference({ type: 'article-journal', title: 'T', author, issued: { 'date-parts': [[2021]] } });
  assert.match(out, /^A1, B\., .*A19, B\., \. \. \. A22, B\. \(2021\)/);
  assert.doesNotMatch(out, /A20/);
});

test('MLA 9 works-cited entries', () => {
  const mla = { style: 'mla' };
  assert.equal(formatReference(article, mla),
    'Smith, John Allen, and Kate Lee. “Deep learning for text similarity.” Journal of Academic Writing, vol. 12, no. 3, 2020, pp. 45-67, https://doi.org/10.1234/jaw.2020.045.');
  assert.equal(formatReference(book, mla), 'Brown, Mary. Writing research papers. 2nd ed., Academic Press, 2018.');
  assert.equal(formatReference(chapter, mla),
    'Khan, Ali, et al. “Citing sources well.” Handbook of scholarly writing, edited by Paul Green and Sara Jane White, Routledge, 2019, pp. 101-120.');
  assert.equal(formatReference(webpage, mla),
    'Writing Centre. “How to avoid plagiarism.” University Library, 15 Mar. 2023, https://example.com/post.');
});

test('HTML and Markdown output italicise and escape', () => {
  assert.equal(formatReference(book, { format: 'html' }), 'Brown, M. (2018). <i>Writing research papers</i> (2nd ed.). Academic Press.');
  assert.equal(formatReference(book, { format: 'markdown' }), 'Brown, M. (2018). *Writing research papers* (2nd ed.). Academic Press.');
  assert.match(formatReference({ ...book, title: 'Tom & <Jerry>' }, { format: 'html' }), /<i>Tom &amp; &lt;Jerry&gt;<\/i>/);
});

test('in-text citations', () => {
  assert.equal(citeInText(article, { page: '50' }), '(Smith & Lee, 2020, p. 50)');
  assert.equal(citeInText(article, { narrative: true }), 'Smith and Lee (2020)');
  assert.equal(citeInText(chapter, { page: '101-103' }), '(Khan et al., 2019, pp. 101–103)');
  assert.equal(citeInText(article, { style: 'mla', page: '50' }), '(Smith and Lee 50)');
  assert.equal(citeInText(chapter, { style: 'mla' }), '(Khan et al.)');
  assert.equal(citeInText({ title: 'Citation guide', year: 2021 }), '(“Citation guide,” 2021)');
  assert.equal(citeInText({ title: 'Citation guide' }, { narrative: true }), '“Citation guide” (n.d.)');
});

test('bibliography is sorted by author then year', () => {
  const out = formatBibliography([article, chapter, book]);
  assert.deepEqual(out.map((s) => s.split(',')[0]), ['Brown', 'Khan', 'Smith']);
});

test('unknown style or format throws a clear error', () => {
  assert.throws(() => formatReference(book, { style: 'xyz' }), /Unknown citation style/);
  assert.throws(() => formatReference(book, { format: 'pdf' }), /Unknown output format/);
});

test('BibTeX export', () => {
  assert.equal(toBibTeX(article), [
    '@article{smith2020deep,',
    '  author = {Smith, John Allen and Lee, Kate},',
    '  title = {Deep learning for text similarity},',
    '  journal = {Journal of Academic Writing},',
    '  year = {2020},',
    '  volume = {12},',
    '  number = {3},',
    '  pages = {45--67},',
    '  doi = {10.1234/jaw.2020.045}',
    '}',
  ].join('\n'));
  assert.match(toBibTeX({ ...book, title: '50% of R&D' }), /title = \{50\\% of R\\&D\}/);
  const keys = toBibTeX([book, book]).match(/@book\{(\w+),/g);
  assert.deepEqual(keys, ['@book{brown2018writing,', '@book{brown2018writinga,']);
});

test('BibTeX round trip keeps the data', () => {
  const [a, b, c] = parseBibTeX(toBibTeX([article, book, chapter]));
  for (const [parsed, original] of [[a, article], [b, book], [c, chapter]]) {
    const { id, ...rest } = parsed;
    assert.deepEqual(rest, original);
  }
});

test('BibTeX import handles LaTeX, macros, organisations and comments', () => {
  const [ref] = parseBibTeX(`
    @comment{ignored}
    @string{jaw = "Journal of Academic Writing"}
    @Article{muller21,
      author  = {M{\\"u}ller, J{\\"o}rg and {World Health Organization}},
      title   = "{T}he {\\&} problem",
      journal = jaw,
      year    = 2021, month = mar,
      pages   = "1--9",
      doi     = {https://doi.org/10.5555/abc}
    }`);
  assert.deepEqual(ref.author, [{ family: 'Müller', given: 'Jörg' }, { literal: 'World Health Organization' }]);
  assert.equal(ref.title, 'The & problem');
  assert.equal(ref['container-title'], 'Journal of Academic Writing');
  assert.deepEqual(ref.issued, { 'date-parts': [[2021, 3]] });
  assert.equal(ref.page, '1-9');
  assert.equal(ref.DOI, '10.5555/abc');
});

test('DOI normalising and extraction', () => {
  assert.equal(normalizeDOI('https://doi.org/10.1234/ABC.5'), '10.1234/ABC.5');
  assert.equal(normalizeDOI('doi: 10.1234/abc'), '10.1234/abc');
  assert.equal(normalizeDOI('not a doi'), null);
  assert.deepEqual(
    extractDOIs('See (doi:10.1000/xyz123). Also https://doi.org/10.1000/xyz123 and 10.5555/a(b)c.'),
    ['10.1000/xyz123', '10.5555/a(b)c'],
  );
});

test('DOI lookup maps Crossref data to CSL-JSON', async () => {
  const fakeFetch = async (url) => {
    assert.equal(url, 'https://api.crossref.org/works/10.1234%2Fjaw.2020.045?mailto=a%40b.org');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          type: 'journal-article',
          title: ['Deep learning for text similarity'],
          author: [{ given: 'John Allen', family: 'Smith' }, { given: 'Kate', family: 'Lee' }],
          'container-title': ['Journal of Academic Writing'],
          issued: { 'date-parts': [[2020]] },
          volume: '12',
          issue: '3',
          page: '45-67',
          DOI: '10.1234/jaw.2020.045',
          URL: 'https://doi.org/10.1234/jaw.2020.045',
          publisher: 'Example Publisher',
        },
      }),
    };
  };
  const ref = await lookupDOI('doi:10.1234/jaw.2020.045', { fetch: fakeFetch, mailto: 'a@b.org' });
  assert.equal(formatReference(ref), formatReference(article));

  const notFound = async () => ({ ok: false, status: 404 });
  await assert.rejects(lookupDOI('10.1234/none', { fetch: notFound }), /DOI not found/);
  await assert.rejects(lookupDOI('nope', { fetch: notFound }), /Not a valid DOI/);
});

test('DOI lookup falls back to doi.org for DataCite DOIs (arXiv, Zenodo)', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push([url, options.headers.Accept]);
    if (url.startsWith('https://api.crossref.org/')) return { ok: false, status: 404 };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        type: 'article',
        title: 'Attention is all you need',
        author: [{ family: 'Vaswani', given: 'Ashish' }, { family: 'Shazeer', given: 'Noam' }],
        issued: { 'date-parts': [[2017]] },
        publisher: 'arXiv',
        DOI: '10.48550/ARXIV.1706.03762',
        abstract: 'ignored',
      }),
    };
  };
  const ref = await lookupDOI('10.48550/arXiv.1706.03762', { fetch: fakeFetch });
  assert.deepEqual(calls[1], ['https://doi.org/10.48550/arXiv.1706.03762', 'application/vnd.citationstyles.csl+json']);
  assert.equal(ref.abstract, undefined);
  assert.equal(formatReference(ref),
    'Vaswani, A., & Shazeer, N. (2017). Attention is all you need. arXiv. https://doi.org/10.48550/ARXIV.1706.03762');
  assert.equal(formatReference(ref, { style: 'mla' }),
    'Vaswani, Ashish, and Noam Shazeer. “Attention is all you need.” arXiv, 2017, https://doi.org/10.48550/ARXIV.1706.03762.');
});

test('Crossref records: markup removed, subtitle kept, book title used for chapters', () => {
  const ref = fromCrossref({
    type: 'book-chapter',
    title: ['Optuna'],
    subtitle: ['A next-generation <i>hyperparameter</i> framework'],
    'container-title': ['Lecture Notes in Computer Science', 'Knowledge Discovery &amp; Data Mining'],
    author: [{ family: 'Akiba', given: 'Takuya' }],
    publisher: 'ACM',
    DOI: '10.1145/1',
  });
  assert.equal(ref.title, 'Optuna: A next-generation hyperparameter framework');
  assert.equal(ref['container-title'], 'Knowledge Discovery & Data Mining');
  assert.equal(fromCrossref({ type: 'journal-article', 'container-title': ['Nature', 'Nat.'] })['container-title'], 'Nature');
});

test('duplicate detection by DOI and by title + first author', () => {
  const groups = findDuplicates([
    article,
    book,
    { ...article, title: 'A different title', DOI: 'https://doi.org/10.1234/JAW.2020.045' },
    { ...book, title: 'Writing Research Papers!' },
    { ...book, author: [{ family: 'Someone', given: 'Else' }] },
  ]);
  assert.deepEqual(groups, [
    { indexes: [0, 2], reasons: ['doi'] },
    { indexes: [1, 3], reasons: ['title'] },
  ]);
  assert.deepEqual(findDuplicates([article, book]), []);
});
