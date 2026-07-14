import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from '../../src/url/sanitize.js';

describe('sanitizeUrl', () => {
  it('allows http and https URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('https://example.com/submit')).toBe('https://example.com/submit');
  });

  it('allows mailto and tel URLs', () => {
    expect(sanitizeUrl('mailto:a@example.com')).toBe('mailto:a@example.com');
    expect(sanitizeUrl('tel:+15551234567')).toBe('tel:+15551234567');
  });

  it('allows relative, absolute-path, query, and anchor URLs', () => {
    expect(sanitizeUrl('/submit')).toBe('/submit');
    expect(sanitizeUrl('submit')).toBe('submit');
    expect(sanitizeUrl('#section')).toBe('#section');
    expect(sanitizeUrl('?a=1')).toBe('?a=1');
    expect(sanitizeUrl('')).toBe('');
  });

  it('rejects javascript: and data: schemes, falling back to #', () => {
    expect(sanitizeUrl('javascript:alert(document.cookie)')).toBe('#');
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
  });

  it('rejects dangerous schemes case-insensitively and with surrounding whitespace', () => {
    expect(sanitizeUrl('  JavaScript:alert(1)  ')).toBe('#');
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('#');
  });

  it('strips embedded tab/newline characters used to bypass scheme detection', () => {
    expect(sanitizeUrl('java' + String.fromCharCode(9) + 'script:alert(1)')).toBe('#');
    expect(sanitizeUrl('java' + String.fromCharCode(10) + 'script:alert(1)')).toBe('#');
  });

  it('respects a custom fallback', () => {
    expect(sanitizeUrl('javascript:alert(1)', '')).toBe('');
  });
});
