export type Name =
  | { family: string; given?: string; suffix?: string }
  | { literal: string }
  | string;

/** A reference in CSL-JSON form (the common fields Plagx Cite uses). */
export interface Reference {
  id?: string;
  type?:
    | 'article-journal' | 'article-magazine' | 'article-newspaper' | 'article'
    | 'book' | 'chapter' | 'paper-conference' | 'report' | 'thesis' | 'webpage'
    | 'entry-encyclopedia' | 'entry-dictionary' | 'dataset' | 'document' | string;
  title?: string;
  author?: Name[];
  editor?: Name[];
  issued?: { 'date-parts': number[][] };
  /** Shortcut for issued year. */
  year?: number | string;
  'container-title'?: string;
  volume?: string | number;
  issue?: string | number;
  page?: string;
  edition?: string | number;
  publisher?: string;
  'publisher-place'?: string;
  genre?: string;
  ISBN?: string;
  DOI?: string;
  URL?: string;
  [field: string]: unknown;
}

export type StyleName = 'apa' | 'mla';
export type OutputFormat = 'text' | 'html' | 'markdown';

export interface FormatOptions {
  style?: StyleName;
  format?: OutputFormat;
}

export interface InTextOptions {
  style?: StyleName;
  /** Page or page range, e.g. "12" or "12-15". */
  page?: string | number;
  /** Narrative form: "Smith (2020)" instead of "(Smith, 2020)". */
  narrative?: boolean;
}

export const styles: StyleName[];
export function formatReference(ref: Reference, options?: FormatOptions): string;
export function formatBibliography(refs: Reference[], options?: FormatOptions): string[];
export function citeInText(ref: Reference, options?: InTextOptions): string;
export function sortReferences(refs: Reference[]): Reference[];

export function toBibTeX(refs: Reference | Reference[]): string;
export function parseBibTeX(source: string): Reference[];

export function normalizeDOI(input: string): string | null;
export function isDOI(input: string): boolean;
export function extractDOIs(text: string): string[];
export function fromCrossref(work: Record<string, unknown>): Reference;
export function lookupDOI(
  doi: string,
  options?: { fetch?: typeof fetch; mailto?: string; signal?: AbortSignal },
): Promise<Reference>;

export interface DuplicateGroup {
  indexes: number[];
  reasons: Array<'doi' | 'title'>;
}
export function findDuplicates(refs: Reference[]): DuplicateGroup[];

export interface CheckIssue {
  level: 'error' | 'warning';
  code: 'duplicate' | 'invalid-doi' | 'doi-not-found' | 'missing-title' | 'missing-author' | 'missing-year';
  /** Index of the reference in the input array. */
  index: number;
  /** The reference id (BibTeX key), or "#n" when it has none. */
  ref: string;
  message: string;
}
export interface CheckResult {
  references: number;
  errors: number;
  warnings: number;
  issues: CheckIssue[];
}
export function checkReferences(
  refs: Reference[],
  options?: { checkDOIs?: boolean; fetch?: typeof fetch; mailto?: string },
): Promise<CheckResult>;
