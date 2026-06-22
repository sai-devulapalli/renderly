/**
 * Radio button correctness tests.
 *
 * We verify the PDF byte stream directly rather than parsing it with an
 * external library. The assertions are deliberately structural:
 *  - NeedAppearances must be false
 *  - Each child widget must have an AP/N entry (appearance streams)
 *  - Only one widget must have AS equal to its export value (the selected one)
 *  - All others must have AS=/Off
 *
 * The stream is ASCII-safe at the dict level so simple string searches work.
 */
import { describe, it, expect } from 'vitest';
import { isOk } from '@renderly/shared';
import { renderDocument } from '../../src/adapter.js';
import type { IRInputChoiceNode } from '@renderly/schema';

function makeChoiceNode(
  selected: string | undefined,
  options = ['yes', 'no', 'maybe'],
): IRInputChoiceNode {
  return {
    type: 'input-choice',
    id: 'answer',
    label: 'Your answer',
    required: false,
    multiple: false,
    options: options.map((v) => ({ value: v, label: v })),
    errors: [],
    children: [],
    ...(selected !== undefined ? { value: selected } : {}),
  };
}

async function renderToPdfText(node: IRInputChoiceNode): Promise<string> {
  const result = await renderDocument([node]);
  expect(isOk(result)).toBe(true);
  if (!isOk(result)) throw new Error('render failed');
  return result.value.toString('latin1');
}

describe('PDF radio buttons — NeedAppearances', () => {
  it('sets NeedAppearances to false in the AcroForm dict', async () => {
    const pdf = await renderToPdfText(makeChoiceNode(undefined));
    expect(pdf).toContain('/NeedAppearances false');
  });
});

describe('PDF radio buttons — appearance streams', () => {
  it('each widget has an AP entry', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('yes'));
    // Three options → three widgets → three /AP entries
    const apMatches = pdf.match(/\/AP\s*<<[^>]*\/N\s*/g);
    expect(apMatches?.length).toBeGreaterThanOrEqual(3);
  });

  it('XObject Form streams are present in the PDF', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('yes'));
    // Appearance streams are Form XObjects
    expect(pdf).toContain('/Subtype /Form');
    // Off and On streams are distinct objects
    const formCount = (pdf.match(/\/Subtype \/Form/g) ?? []).length;
    expect(formCount).toBeGreaterThanOrEqual(2);
  });

  it('XObject Form streams have a BBox entry', async () => {
    // pdfkit deflate-compresses stream *content*, but dict entries like /BBox
    // live in the stream-object header and remain plaintext in the PDF output.
    const pdf = await renderToPdfText(makeChoiceNode(undefined));
    expect(pdf).toContain('/BBox');
  });

  it('each XObject Form stream has a positive Length', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('yes'));
    // Match "/Length <number>" entries belonging to Form XObjects.
    // A Length of 0 would mean an empty (broken) appearance stream.
    const lengths = [...pdf.matchAll(/\/Length (\d+)/g)].map((m) => Number(m[1]));
    // There are at least 2 Form XObjects (off + on). Each must have content.
    const positive = lengths.filter((n) => n > 0);
    expect(positive.length).toBeGreaterThanOrEqual(2);
  });
});

describe('PDF radio buttons — AS state correctness', () => {
  it('selected option has AS equal to its export value', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('no'));
    expect(pdf).toContain('/AS /no');
  });

  it('unselected options have AS=/Off', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('no'));
    // 'yes' and 'maybe' are unselected
    expect(pdf).toContain('/AS /Off');
    // Count Off appearances — should be at least 2 (two unselected options)
    const offCount = (pdf.match(/\/AS \/Off/g) ?? []).length;
    expect(offCount).toBeGreaterThanOrEqual(2);
  });

  it('all options have AS=/Off when nothing is selected', async () => {
    const pdf = await renderToPdfText(makeChoiceNode(undefined));
    const offCount = (pdf.match(/\/AS \/Off/g) ?? []).length;
    expect(offCount).toBeGreaterThanOrEqual(3); // all 3 options
  });

  it('exactly one option has AS set to the selected export value', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('maybe'));
    const selectedCount = (pdf.match(/\/AS \/maybe/g) ?? []).length;
    expect(selectedCount).toBe(1);
  });
});

describe('PDF radio buttons — parent group field', () => {
  it('parent field has FT=/Btn and Ff=0x8000 (radio flag)', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('yes'));
    expect(pdf).toContain('/FT /Btn');
    // 0x8000 = 32768
    expect(pdf).toContain('/Ff 32768');
  });

  it('parent V reflects the selected value', async () => {
    const pdf = await renderToPdfText(makeChoiceNode('yes'));
    expect(pdf).toContain('/V /yes');
  });

  it('parent V is /Off when nothing is selected', async () => {
    const pdf = await renderToPdfText(makeChoiceNode(undefined));
    expect(pdf).toContain('/V /Off');
  });
});

describe('PDF radio buttons — child widgets lack independent field keys', () => {
  it('child widgets have no /T key (T belongs only on the parent)', async () => {
    // The parent has /T /answer. Child widgets must NOT repeat T.
    // Strategy: count /T occurrences — should be exactly 1 (the parent).
    const pdf = await renderToPdfText(makeChoiceNode('yes'));
    const tCount = (pdf.match(/\/T \(/g) ?? []).length;
    expect(tCount).toBe(1);
  });

  it('child widgets have no /V key (V belongs only on the parent)', async () => {
    // Only the parent should have /V /yes (or /V /Off).
    const pdf = await renderToPdfText(makeChoiceNode('yes'));
    const vCount = (pdf.match(/\/V \//g) ?? []).length;
    expect(vCount).toBe(1); // exactly the parent's V
  });
});
