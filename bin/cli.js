// Plagx Cite command line. A free academic writing utility by Plagiarism Checker X.
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import {
  formatBibliography, sortReferences, toBibTeX, parseBibTeX, lookupDOI, formatReference, checkReferences, styles,
} from '../src/index.js';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const HELP = `Plagx Cite ${VERSION}: format and check references (APA 7 / MLA 9, BibTeX, DOI)

Usage:
  plagx-cite format <file>      Print a formatted reference list
  plagx-cite check <file>       Check for duplicates, invalid DOIs and missing fields
  plagx-cite doi <doi> [...]    Look up DOIs and print formatted references
  plagx-cite bibtex <file>      Convert a reference file to BibTeX

<file> is a .bib (BibTeX) or .json (CSL-JSON) file. Use - to read from stdin.

Options:
  --style apa|mla               Citation style (default: apa)
  --format text|html|markdown   Output format (default: text)
  --check-dois                  check: look up every DOI online
  --strict                      check: treat warnings as errors
  --json                        check: print the result as JSON
  --mailto <email>              Email for the Crossref polite pool (optional)
  -v, --version                 Show version
  -h, --help                    Show this help

Exit codes: 0 = OK, 1 = problems found (check), 2 = usage or input error.

A free academic writing utility by Plagiarism Checker X. It does not check for
plagiarism or AI-generated text: https://plagiarismcheckerx.com/`;

class UsageError extends Error {}

function parseArgs(argv) {
  const opts = { style: 'apa', format: 'text', checkDois: false, strict: false, json: false, mailto: undefined };
  const args = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '--style') opts.style = value();
    else if (a.startsWith('--style=')) opts.style = a.slice(8);
    else if (a === '--format') opts.format = value();
    else if (a.startsWith('--format=')) opts.format = a.slice(9);
    else if (a === '--mailto') opts.mailto = value();
    else if (a === '--check-dois') opts.checkDois = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-v' || a === '--version') opts.version = true;
    else if (a.startsWith('-') && a !== '-') throw new UsageError(`Unknown option ${a}`);
    else args.push(a);
  }
  if (!styles.includes(opts.style)) throw new UsageError(`Unknown style "${opts.style}". Use: ${styles.join(', ')}`);
  return { opts, args };
}

export function loadReferences(path) {
  let text;
  try {
    text = readFileSync(path === '-' ? 0 : path, 'utf8');
  } catch (err) {
    throw new UsageError(`Cannot read ${path}: ${err.code === 'ENOENT' ? 'file not found' : err.message}`);
  }
  const ext = extname(path).toLowerCase();
  const looksJson = ext === '.json' || (path === '-' && /^\s*[[{]/.test(text));
  if (looksJson) {
    let data;
    try { data = JSON.parse(text); } catch (err) { throw new UsageError(`${path} is not valid JSON: ${err.message}`); }
    const refs = Array.isArray(data) ? data : data.items || data.references;
    if (!Array.isArray(refs)) throw new UsageError(`${path} must contain a CSL-JSON array of references`);
    return refs;
  }
  return parseBibTeX(text);
}

function printCheck(file, result) {
  const lines = [`${file}: ${result.references} reference(s), ${result.errors} error(s), ${result.warnings} warning(s)`];
  for (const x of result.issues) lines.push(`  ${x.level.padEnd(7)} ${x.ref}: ${x.message}`);
  return lines.join('\n');
}

export async function main(argv, out = process.stdout, err = process.stderr) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (e) {
    err.write(`${e.message}\n\nRun plagx-cite --help for usage.\n`);
    return 2;
  }
  const { opts, args } = parsed;
  if (opts.version) { out.write(`${VERSION}\n`); return 0; }
  const [command, ...rest] = args;
  if (opts.help || !command) { out.write(`${HELP}\n`); return command || opts.help ? 0 : 2; }

  try {
    if (command === 'format' || command === 'bibtex' || command === 'check') {
      if (!rest.length) throw new UsageError(`${command} needs a file (.bib or .json, or - for stdin)`);
      let failed = false;
      const reports = [];
      for (const file of rest) {
        const refs = loadReferences(file);
        if (command === 'format') {
          out.write(`${formatBibliography(refs, { style: opts.style, format: opts.format }).join('\n')}\n`);
        } else if (command === 'bibtex') {
          out.write(`${toBibTeX(sortReferences(refs))}\n`);
        } else {
          const result = await checkReferences(refs, { checkDOIs: opts.checkDois, mailto: opts.mailto });
          if (result.errors || (opts.strict && result.warnings)) failed = true;
          reports.push({ file, ...result });
        }
      }
      if (command === 'check') {
        out.write(opts.json ? `${JSON.stringify(reports, null, 2)}\n` : `${reports.map((r) => printCheck(r.file, r)).join('\n\n')}\n`);
        return failed ? 1 : 0;
      }
      return 0;
    }

    if (command === 'doi') {
      if (!rest.length) throw new UsageError('doi needs at least one DOI');
      let failed = false;
      for (const doi of rest) {
        try {
          out.write(`${formatReference(await lookupDOI(doi, { mailto: opts.mailto }), { style: opts.style, format: opts.format })}\n`);
        } catch (e) {
          err.write(`${e.message}\n`);
          failed = true;
        }
      }
      return failed ? 1 : 0;
    }

    throw new UsageError(`Unknown command "${command}"`);
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    err.write(`${e.message}\n\nRun plagx-cite --help for usage.\n`);
    return 2;
  }
}
