import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../bin/cli.js';
import { checkReferences, formatReference } from '../src/index.js';

const dir = mkdtempSync(join(tmpdir(), 'plagx-cite-'));
const bib = join(dir, 'refs.bib');
writeFileSync(bib, `
@article{smith2020, author={Smith, John and Lee, Kate}, title={Deep learning for text similarity},
  journal={Journal of Academic Writing}, year=2020, volume=12, number=3, pages={45--67}}
@book{brown2018, author={Brown, Mary}, title={Writing research papers}, publisher={Academic Press}, year=2018}
@article{smithdup, author={Smith, J.}, title={Deep Learning for Text Similarity!}, journal={JAW}, year=2020}
@misc{bad, title={Untitled web page}, doi={not-a-doi}}
`);
const clean = join(dir, 'clean.json');
writeFileSync(clean, JSON.stringify([{ type: 'book', title: 'T', author: [{ family: 'A', given: 'B' }], year: 2001 }]));

async function run(...args) {
  let stdout = '';
  let stderr = '';
  const code = await main(args, { write: (s) => { stdout += s; } }, { write: (s) => { stderr += s; } });
  return { code, stdout, stderr };
}

test('format prints a sorted reference list', async () => {
  const { code, stdout } = await run('format', clean);
  assert.equal(code, 0);
  assert.equal(stdout, 'A, B. (2001). T.\n');
  const mla = await run('format', bib, '--style', 'mla');
  assert.match(mla.stdout.split('\n')[0], /^Brown, Mary\. Writing research papers\./);
});

test('check reports duplicates, invalid DOIs and missing fields', async () => {
  const { code, stdout } = await run('check', bib);
  assert.equal(code, 1);
  assert.match(stdout, /4 reference\(s\), 2 error\(s\), 2 warning\(s\)/);
  assert.match(stdout, /error {3}smithdup: Possible duplicate \(title match\)/);
  assert.match(stdout, /error {3}bad: Invalid DOI "not-a-doi"/);
  assert.equal((await run('check', clean)).code, 0);
});

test('check --json and --strict', async () => {
  const [report] = JSON.parse((await run('check', bib, '--json')).stdout);
  assert.deepEqual(report.issues.map((x) => x.code), ['duplicate', 'invalid-doi', 'missing-author', 'missing-year']);
  const warnOnly = join(dir, 'warn.json');
  writeFileSync(warnOnly, JSON.stringify([{ title: 'No author here', year: 2020 }]));
  assert.equal((await run('check', warnOnly)).code, 0);
  assert.equal((await run('check', warnOnly, '--strict')).code, 1);
});

test('bibtex converts CSL-JSON', async () => {
  const { code, stdout } = await run('bibtex', clean);
  assert.equal(code, 0);
  assert.match(stdout, /^@book\{a2001,/);
});

test('usage errors exit with 2', async () => {
  assert.equal((await run()).code, 2);
  assert.equal((await run('format')).code, 2);
  assert.equal((await run('format', join(dir, 'missing.bib'))).code, 2);
  assert.equal((await run('format', clean, '--style', 'chicago')).code, 2);
  assert.equal((await run('nope')).code, 2);
  assert.match((await run('--version')).stdout, /^\d+\.\d+\.\d+\n$/);
});

test('checkReferences can verify DOIs online (mocked)', async () => {
  const fetch = async () => ({ ok: false, status: 404 });
  const result = await checkReferences([{ title: 'X', author: ['A B'], year: 2000, DOI: '10.1234/missing' }], { checkDOIs: true, fetch });
  assert.deepEqual(result.issues.map((x) => x.code), ['doi-not-found']);
});

test('invalid DOIs are not printed as links; full DOI URLs are not doubled', () => {
  const base = { type: 'book', title: 'T', author: [{ family: 'A', given: 'B' }], year: 2001 };
  assert.equal(formatReference({ ...base, DOI: 'not-a-doi' }), 'A, B. (2001). T.');
  assert.equal(formatReference({ ...base, DOI: 'https://doi.org/10.1234/x' }), 'A, B. (2001). T. https://doi.org/10.1234/x');
});
