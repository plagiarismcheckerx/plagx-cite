// Copies the library into docs/lib so the GitHub Pages demo can import it.
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
rmSync(`${root}docs/lib`, { recursive: true, force: true });
cpSync(`${root}src`, `${root}docs/lib`, { recursive: true });
console.log('Copied src/ to docs/lib/');
