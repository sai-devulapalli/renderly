const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"'`]/g, (c) => HTML_ESCAPE_MAP[c] as string);
}
