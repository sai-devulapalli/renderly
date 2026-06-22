import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../src/escape.js';

describe('escapeHtml — special characters', () => {
  it('escapes ampersand', () => expect(escapeHtml('a & b')).toBe('a &amp; b'));
  it('escapes less-than', () => expect(escapeHtml('<script>')).toBe('&lt;script&gt;'));
  it('escapes greater-than', () => expect(escapeHtml('a > b')).toBe('a &gt; b'));
  it('escapes double-quote', () => expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;'));
  it("escapes single-quote", () => expect(escapeHtml("it's")).toBe('it&#x27;s'));
  it('escapes backtick', () => expect(escapeHtml('a`b')).toBe('a&#x60;b'));

  it('escapes multiple special chars in one string', () => {
    expect(escapeHtml('<div class="a&b">it\'s</div>')).toBe(
      '&lt;div class=&quot;a&amp;b&quot;&gt;it&#x27;s&lt;/div&gt;',
    );
  });

  it('returns safe strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('escapeHtml — XSS vectors', () => {
  it('neutralises a script injection', () => {
    const result = escapeHtml('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('neutralises an attribute injection', () => {
    const result = escapeHtml('" onclick="alert(1)');
    expect(result).not.toContain('"');
    expect(result).toBe('&quot; onclick=&quot;alert(1)');
  });

  it('neutralises a backtick template-literal injection', () => {
    const result = escapeHtml('`);alert(1);//');
    expect(result).not.toContain('`');
    expect(result).toBe('&#x60;);alert(1);//');
  });
});
