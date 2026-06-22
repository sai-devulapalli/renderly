/**
 * preview.mjs — run sample.json through all four Renderly output adapters.
 *
 * Usage:
 *   node preview.mjs [path/to/document.json]
 *
 * Outputs:
 *   preview.html  — open in any browser
 *   preview.md    — raw Markdown
 *   preview.pdf   — open in Preview / Acrobat
 *   (terminal)    — Markdown render with live field values + conditional rules
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── resolve package entry points from the workspace ──────────────────────────

const ROOT = new URL('.', import.meta.url).pathname;
const pkg = (name) => resolve(ROOT, 'packages', name, 'dist', 'index.js');

const { parseDocument }       = await import(pkg('input'));
const { walk, createDefaultRegistry } = await import(pkg('core'));
const { renderDocument: renderHtml }  = await import(pkg('html'));
const { renderDocument: renderMd }    = await import(pkg('markdown'));
const { renderDocument: renderPdf }   = await import(pkg('pdf'));

// ── load document ─────────────────────────────────────────────────────────────

const file = process.argv[2] ?? 'sample.json';
const json = readFileSync(file, 'utf-8');

const parsed = parseDocument(json);
if (!parsed.ok) {
  const e = parsed.error;
  if (e.code === 'VALIDATION_ERROR') {
    console.error('✗ Invalid document:');
    for (const f of e.failures) console.error(`  • ${f.path}: ${f.message}`);
  } else {
    console.error(`✗ Parse error: ${e.message}`);
  }
  process.exit(1);
}

const doc = parsed.value;
console.log(`\n📄 Loaded: ${file}  (${doc.elements.length} top-level elements)\n`);

// ── field values (shared across all adapters) ─────────────────────────────────

const VALUES = {
  first_name: 'Jane',
  last_name: 'Smith',
  age: 32,
  weight: 70,     // kg  (used by the BMI computed field)
  height: 1.75,   // m
  gender: 'f',
  patient_type: 'minor',   // triggers guardian_name to show
};

// ── 1. HTML ───────────────────────────────────────────────────────────────────

const htmlNodes = walk(doc, createDefaultRegistry(), { values: VALUES });
if (!htmlNodes.ok) {
  console.error('✗ Walk failed:', htmlNodes.error.code);
  process.exit(1);
}

const htmlResult = renderHtml(htmlNodes.value);
if (!htmlResult.ok) {
  console.error('✗ HTML render failed:', htmlResult.error.code);
} else {
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${doc.title ?? 'Renderly Preview'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 20px; background: #f5f5f5; }
    .renderly-doc { background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .field { margin-top: 18px; }
    label { font-weight: 600; display: block; margin-bottom: 4px; }
    input[type=text], input[type=number], input[type=date] {
      border: 1px solid #ccc; border-radius: 4px; padding: 7px 10px;
      width: 100%; font-size: 14px; margin-top: 2px;
    }
    input[type=text]:focus, input[type=number]:focus, input[type=date]:focus {
      outline: none; border-color: #0055cc; box-shadow: 0 0 0 3px rgba(0,85,204,.15);
    }
    fieldset.choice-group { border: none; padding: 0; margin: 18px 0 0; }
    fieldset.choice-group legend { font-weight: 600; font-size: 14px; margin-bottom: 8px; padding: 0; }
    .choice-option { display: flex; align-items: center; gap: 8px; padding: 6px 10px;
      border-radius: 6px; cursor: pointer; font-weight: 400; margin-top: 4px; }
    .choice-option:hover { background: #f0f4ff; }
    .choice-option input[type=radio], .choice-option input[type=checkbox] {
      width: 16px; height: 16px; cursor: pointer; accent-color: #0055cc; flex-shrink: 0;
    }
    button { margin-top: 24px; background: #0055cc; color: #fff; border: none;
      padding: 10px 24px; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; }
    button:hover { background: #0044aa; }
    h1,h2,h3 { margin-top: 0; }
    .field-errors { color: #cc2200; font-size: 13px; margin: 4px 0 0; padding-left: 16px; }
    [data-intent=muted] { color: #888; font-size: 13px; }
  </style>
</head>
<body>
  <div class="renderly-doc">
${htmlResult.value}
  </div>
</body>
</html>`;
  writeFileSync('preview.html', page);
  console.log('✓ HTML  →  preview.html   (open in browser)');
}

// ── 2. Markdown ───────────────────────────────────────────────────────────────

const mdNodes = walk(doc, createDefaultRegistry());
if (mdNodes.ok) {
  const mdResult = renderMd(mdNodes.value);
  if (mdResult.ok) {
    writeFileSync('preview.md', mdResult.value);
    console.log('✓ Markdown  →  preview.md');
    console.log('\n──────────────── Markdown output ────────────────');
    console.log(mdResult.value.trim());
    console.log('─────────────────────────────────────────────────\n');
  }
}

// ── 3. PDF ────────────────────────────────────────────────────────────────────

const pdfNodes = walk(doc, createDefaultRegistry(), { values: VALUES });
if (pdfNodes.ok) {
  try {
    const pdfResult = await renderPdf(pdfNodes.value);
    if (!pdfResult.ok) {
      console.error('✗ PDF render failed:', pdfResult.error.code);
    } else {
      writeFileSync('preview.pdf', pdfResult.value);
      console.log('✓ PDF   →  preview.pdf    (open in Preview / Acrobat)\n');
    }
  } catch (e) {
    console.error('✗ PDF exception:', e);
  }
}

// ── 4. Conditional rules + computed fields with live values ───────────────────

console.log('──────── With live field values (rules + computed) ────────');
console.log('Values:', VALUES, '\n');

const liveNodes = walk(doc, createDefaultRegistry(), { values: VALUES });
if (!liveNodes.ok) {
  console.error('Walk failed:', liveNodes.error.code);
} else {
  const liveMd = renderMd(liveNodes.value);
  if (liveMd.ok) {
    console.log(liveMd.value.trim());
  }
}
console.log('───────────────────────────────────────────────────────────\n');
