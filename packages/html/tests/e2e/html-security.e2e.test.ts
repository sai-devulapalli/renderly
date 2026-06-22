import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { applyErrors } from '@renderly/submit';
import { renderDocument } from '../../src/adapter.js';
import { isOk } from '@renderly/shared';

// ── helpers ───────────────────────────────────────────────────────────────────

const BASE_JSON = JSON.stringify({
  version: '1',
  elements: [
    { type: 'input', kind: 'text', id: 'name', label: 'Name', required: true },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api' },
  ],
});

function pipelineRender(json: string): string {
  const docResult = parseDocument(json);
  if (!isOk(docResult)) throw new Error(`parse failed: ${JSON.stringify(docResult)}`);
  const walkResult = walk(docResult.value, createDefaultRegistry());
  if (!isOk(walkResult)) throw new Error(`walk failed: ${JSON.stringify(walkResult)}`);
  const htmlResult = renderDocument(walkResult.value);
  if (!isOk(htmlResult)) throw new Error(`render failed: ${JSON.stringify(htmlResult)}`);
  return htmlResult.value;
}

function pipelineRenderWithErrors(errors: Record<string, unknown>): string {
  const docResult = parseDocument(BASE_JSON);
  if (!isOk(docResult)) throw new Error('parse failed');
  const withErrors = applyErrors(docResult.value, errors);
  const walkResult = walk(withErrors, createDefaultRegistry());
  if (!isOk(walkResult)) throw new Error('walk failed');
  const htmlResult = renderDocument(walkResult.value);
  if (!isOk(htmlResult)) throw new Error('render failed');
  return htmlResult.value;
}

// ── XSS in server-returned errors ────────────────────────────────────────────
// Server responses can include error messages with user-supplied content.
// applyErrors embeds them in the Document; the render pipeline must escape them.

describe('html adapter — XSS in server-returned form errors', () => {
  it('escapes <script> injection in form-level error', () => {
    const html = pipelineRenderWithErrors({ form: ['<script>alert(1)</script>'] });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes attribute injection in form-level error', () => {
    const html = pipelineRenderWithErrors({ form: ['" onmouseover="alert(1)'] });
    expect(html).not.toContain('" onmouseover=');
    expect(html).toContain('&quot; onmouseover=&quot;');
  });

  it('escapes <script> injection in field-level error', () => {
    const html = pipelineRenderWithErrors({ fields: { name: ['<script>alert(1)</script>'] } });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes all 6 XSS chars in form error messages', () => {
    const html = pipelineRenderWithErrors({ form: ["& < > \" ' `"] });
    expect(html).toContain('&amp;');
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#x27;');
    expect(html).toContain('&#x60;');
  });

  it('escapes all 6 XSS chars in field error messages', () => {
    const html = pipelineRenderWithErrors({ fields: { name: ["& < > \" ' `"] } });
    expect(html).toContain('&amp;');
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#x27;');
    expect(html).toContain('&#x60;');
  });
});

// ── backtick regression guard ─────────────────────────────────────────────────
// ADR-0001: backtick was absent from the escape map. This test would catch
// a regression where the backtick entry is accidentally removed.

describe('html adapter — backtick regression guard', () => {
  it('backtick in heading text is escaped in output', () => {
    const html = pipelineRender(JSON.stringify({
      version: '1',
      elements: [{ type: 'heading', level: 1, text: '`document.cookie`' }],
    }));
    expect(html).not.toContain('`');
    expect(html).toContain('&#x60;');
  });

  it('backtick in text content is escaped', () => {
    const html = pipelineRender(JSON.stringify({
      version: '1',
      elements: [{ type: 'text', content: 'Press `Enter` to continue' }],
    }));
    expect(html).not.toContain('`');
    expect(html).toContain('&#x60;');
  });

  it('backtick in input label is escaped', () => {
    const html = pipelineRender(JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'f', label: 'Use `backticks`' },
        { type: 'submit', id: 's', label: 'Go', route: '/api' },
      ],
    }));
    expect(html).not.toContain('`');
    expect(html).toContain('&#x60;');
  });

  it('template literal injection in submit route is escaped', () => {
    const html = pipelineRender(JSON.stringify({
      version: '1',
      elements: [
        { type: 'submit', id: 's', label: 'Go', route: '/api?cb=`);alert(1);//' },
      ],
    }));
    expect(html).not.toContain('`');
    expect(html).toContain('&#x60;');
  });
});

// ── single-quote and other chars through full pipeline ────────────────────────

describe("html adapter — single-quote and apostrophe escaping", () => {
  it("escapes single-quote in form labels through full pipeline", () => {
    const html = pipelineRender(JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: "Patient's Name" },
        { type: 'submit', id: 's', label: 'Save', route: '/api' },
      ],
    }));
    expect(html).not.toContain("Patient's");
    expect(html).toContain('&#x27;');
  });

  it('escapes ampersand in submit label', () => {
    const html = pipelineRender(JSON.stringify({
      version: '1',
      elements: [
        { type: 'submit', id: 's', label: 'Save & Exit', route: '/api' },
      ],
    }));
    expect(html).toContain('Save &amp; Exit');
    expect(html).not.toContain('Save & Exit');
  });
});
