/**
 * Zero-dependency Markdown → Steam Workshop BBCode converter.
 *
 * Supported: headers (h1-h3, h4-h6 degrade to h3), bold, italic,
 * strikethrough, links, images (absolute URLs only), unordered/ordered lists,
 * GFM tables, fenced code blocks, inline code, blockquotes, horizontal rules.
 *
 * Unsupported Markdown passes through as plain text.
 */

// ---------------------------------------------------------------------------
// Inline formatting
// ---------------------------------------------------------------------------

function convertInline(text: string): string {
  // Images: absolute URLs → [img], relative/local → alt text only
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_match: string, alt: string, url: string) =>
      /^https?:\/\//.test(url) ? `[img]${url}[/img]` : alt,
  );

  // Links: [text](url) → [url=url]text[/url]
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '[url=$2]$1[/url]',
  );

  // Inline code (before bold/italic so backtick content is protected)
  text = text.replace(/`([^`]+)`/g, '[code]$1[/code]');

  // Bold + italic (*** or ___ with word boundaries)
  text = text.replace(/\*{3}(.+?)\*{3}/g, '[b][i]$1[/i][/b]');
  text = text.replace(/(?<!\w)_{3}(.+?)_{3}(?!\w)/g, '[b][i]$1[/i][/b]');

  // Bold (** or __ with word boundaries)
  text = text.replace(/\*{2}(.+?)\*{2}/g, '[b]$1[/b]');
  text = text.replace(/(?<!\w)_{2}(.+?)_{2}(?!\w)/g, '[b]$1[/b]');

  // Italic (single * with word boundaries)
  text = text.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '[i]$1[/i]');

  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, '[strike]$1[/strike]');

  return text;
}

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------

const TABLE_ROW = /^\|(.+)\|\s*$/;
const TABLE_SEP = /^\|[\s:]*-{1,}[\s:]*(\|[\s:]*-{1,}[\s:]*)*\|\s*$/;

function parseTableCells(line: string): string[] {
  return line.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
}

function convertTable(lines: string[], startIndex: number): { bbcode: string[]; consumed: number } {
  const out: string[] = [];
  let i = startIndex;

  // Header row
  const headers = parseTableCells(lines[i]);
  i++; // skip header
  i++; // skip separator

  out.push('[table]');

  // Header
  out.push('[tr]');
  for (const cell of headers) out.push(`[th]${convertInline(cell)}[/th]`);
  out.push('[/tr]');

  // Body rows
  while (i < lines.length && TABLE_ROW.test(lines[i])) {
    const cells = parseTableCells(lines[i]);
    out.push('[tr]');
    for (const cell of cells) out.push(`[td]${convertInline(cell)}[/td]`);
    out.push('[/tr]');
    i++;
  }

  out.push('[/table]');
  return { bbcode: out, consumed: i - startIndex };
}

// ---------------------------------------------------------------------------
// Block-level processing
// ---------------------------------------------------------------------------

const FENCE_OPEN = /^(`{3,}|~{3,})/;
const HEADER = /^(#{1,6})\s+(.+?)(?:\s+#+)?$/;
const HR = /^(?:---+|\*\*\*+|___+)\s*$/;
const UL_ITEM = /^[-*+]\s+(.*)/;
const OL_ITEM = /^\d+\.\s+(.*)/;
const BLOCKQUOTE = /^>\s?(.*)/;

/** Check whether line `i` starts a GFM table (header row + separator). */
function isTableStart(lines: string[], i: number): boolean {
  return (
    TABLE_ROW.test(lines[i]) &&
    i + 1 < lines.length &&
    TABLE_SEP.test(lines[i + 1])
  );
}

function convertBlocks(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  /** Collect consecutive lines matching `re`, returning captured group 1. */
  function collectRun(re: RegExp): string[] {
    const items: string[] = [];
    while (i < lines.length) {
      const m = lines[i].match(re);
      if (!m) break;
      items.push(m[1]);
      i++;
    }
    return items;
  }

  while (i < lines.length) {
    const line = lines[i];

    // --- fenced code block ---
    const fenceMatch = line.match(FENCE_OPEN);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const codeLines: string[] = [];
      i++; // skip opening fence
      while (i < lines.length && !lines[i].startsWith(fence)) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence
      out.push(`[code]${codeLines.join('\n')}[/code]`);
      continue;
    }

    // --- blank line ---
    if (line.trim() === '') {
      out.push('');
      i++;
      continue;
    }

    // --- header (h1-h6, capped at h3 for Steam BBCode) ---
    const hMatch = line.match(HEADER);
    if (hMatch) {
      const level = Math.min(hMatch[1].length, 3);
      out.push(`[h${level}]${convertInline(hMatch[2])}[/h${level}]`);
      i++;
      continue;
    }

    // --- horizontal rule ---
    if (HR.test(line)) {
      out.push('[hr][/hr]');
      i++;
      continue;
    }

    // --- GFM table ---
    if (isTableStart(lines, i)) {
      const result = convertTable(lines, i);
      out.push(...result.bbcode);
      i += result.consumed;
      continue;
    }

    // --- unordered list ---
    if (UL_ITEM.test(line)) {
      const items = collectRun(UL_ITEM);
      out.push('[list]');
      for (const item of items) out.push(`[*]${convertInline(item)}`);
      out.push('[/list]');
      continue;
    }

    // --- ordered list ---
    if (OL_ITEM.test(line)) {
      const items = collectRun(OL_ITEM);
      out.push('[olist]');
      for (const item of items) out.push(`[*]${convertInline(item)}`);
      out.push('[/olist]');
      continue;
    }

    // --- blockquote ---
    if (BLOCKQUOTE.test(line)) {
      const qLines = collectRun(BLOCKQUOTE);
      // Recursively convert the inner Markdown
      const inner = convertBlocks(qLines).join('\n');
      out.push(`[quote]${inner}[/quote]`);
      continue;
    }

    // --- paragraph (default) ---
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !FENCE_OPEN.test(lines[i]) &&
      !HEADER.test(lines[i]) &&
      !HR.test(lines[i]) &&
      !isTableStart(lines, i) &&
      !UL_ITEM.test(lines[i]) &&
      !OL_ITEM.test(lines[i]) &&
      !BLOCKQUOTE.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    out.push(convertInline(paraLines.join('\n')));
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Convert a Markdown string to Steam Workshop BBCode. */
export function markdownToBbcode(markdown: string): string {
  // Normalize line endings and strip HTML comments (authoring instructions)
  const normalized = markdown.replace(/\r\n/g, '\n');
  const stripped = normalized.replace(/<!--[\s\S]*?-->/g, '');

  const lines = stripped.split('\n');
  const bbcode = convertBlocks(lines).join('\n');

  // Collapse 3+ consecutive blank lines to 2, then trim
  return bbcode.replace(/\n{3,}/g, '\n\n').trim();
}
