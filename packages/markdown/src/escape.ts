/** Escape Markdown special characters in inline text. */
export function escapeMd(s: string): string {
  return s.replace(/[\\`*_{}[\]()#+\-.!|]/g, (c) => `\\${c}`);
}
