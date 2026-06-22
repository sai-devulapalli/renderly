import type {
  IRContainerNode,
  IRHeadingNode,
  IRTextNode,
  IRInputTextNode,
  IRInputNumberNode,
  IRInputDateNode,
  IRInputChoiceNode,
  IRSubmitNode,
  IRFormErrorNode,
  IRFieldErrorNode,
  IRRepeatNode,
  IRInputFileNode,
  IRSignatureNode,
  IRCustomNode,
  ColorIntent,
} from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import type { PdfDoc, PdfError, RenderChildrenFn } from './types.js';

// ── style constants ───────────────────────────────────────────────────────────

const FONT_REGULAR = 'Helvetica';
const FONT_BOLD    = 'Helvetica-Bold';
const BASE_COLOR   = '#222222';
const MUTED_COLOR  = '#666666';
const BORDER_COLOR = '#cccccc';
const ERROR_COLOR  = '#cc2200';
const BTN_COLOR    = '#0055cc';

const INTENT_COLOR: Record<ColorIntent, string> = {
  default: '#222222',
  accent:  '#0055cc',
  good:    '#1a7a1a',
  danger:  '#cc2200',
  muted:   '#888888',
};

const HEADING_FONT_SIZE: Record<number, number> = {
  1: 22, 2: 18, 3: 15, 4: 13, 5: 12, 6: 11,
};

const SECTION_GAP = 8;
const FIELD_GAP = 14;

// ── helpers ───────────────────────────────────────────────────────────────────

function fieldErrors(doc: PdfDoc, errors: readonly string[]): void {
  for (const msg of errors) {
    doc.moveDown(0.2)
       .fillColor(ERROR_COLOR)
       .font(FONT_REGULAR)
       .fontSize(9)
       .text(`! ${msg}`, { indent: 2 });
  }
}

// ── element renderers ─────────────────────────────────────────────────────────

export function renderContainer(
  node: IRContainerNode,
  doc: PdfDoc,
  renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  return renderChildren(node.children, doc);
}

export function renderHeading(
  node: IRHeadingNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  const size = HEADING_FONT_SIZE[node.level] ?? 12;
  doc.moveDown(0.5)
     .fillColor(BASE_COLOR)
     .font(FONT_BOLD)
     .fontSize(size)
     .text(node.text);
  doc.moveDown(0.3);
  return ok(undefined);
}

export function renderText(
  node: IRTextNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  const color = INTENT_COLOR[node.intent];
  const font = node.weight === 'bold' ? FONT_BOLD : FONT_REGULAR;
  doc.fillColor(color)
     .font(font)
     .fontSize(10)
     .text(node.content);
  doc.moveDown(0.3);
  return ok(undefined);
}

function renderFieldBox(
  doc: PdfDoc,
  fieldId: string,
  label: string,
  required: boolean,
  hint: string,
  currentValue?: string,
): void {
  const requiredMark = required ? ' *' : '';
  doc.fillColor(MUTED_COLOR)
     .font(required ? FONT_BOLD : FONT_REGULAR)
     .fontSize(9)
     .text(`${label}${requiredMark}`);

  const x = doc.page.margins.left;
  const y = doc.y + 2;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const h = 18;

  // Draw the border/background
  doc.roundedRect(x, y, w, h, 2)
     .strokeColor(BORDER_COLOR)
     .fillAndStroke('#ffffff', BORDER_COLOR);

  // Overlay an interactive text field over the drawn box
  doc.formText(fieldId, x, y, w, h, {
    value: currentValue ?? '',
    placeholder: hint,
    backgroundColor: 'transparent' as unknown as string,
    borderColor: BORDER_COLOR,
    fontSize: 9,
    align: 'left',
  } as object);

  // Show placeholder text if no value
  if (!currentValue) {
    doc.fillColor('#aaaaaa')
       .font(FONT_REGULAR)
       .fontSize(9)
       .text(hint, x + 6, y + 5, { width: w - 12 });
  } else {
    doc.fillColor(BASE_COLOR)
       .font(FONT_REGULAR)
       .fontSize(9)
       .text(currentValue, x + 6, y + 5, { width: w - 12 });
  }

  doc.y = y + h + FIELD_GAP;
}

export function renderInputText(
  node: IRInputTextNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  renderFieldBox(doc, node.id, node.label, node.required, node.placeholder ?? 'Enter text…');
  fieldErrors(doc, node.errors);
  return ok(undefined);
}

export function renderInputNumber(
  node: IRInputNumberNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  renderFieldBox(doc, node.id, node.label, node.required, node.placeholder ?? 'Enter number…');
  fieldErrors(doc, node.errors);
  return ok(undefined);
}

export function renderInputDate(
  node: IRInputDateNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  renderFieldBox(doc, node.id, node.label, node.required, 'MM / DD / YYYY');
  fieldErrors(doc, node.errors);
  return ok(undefined);
}

// ── Radio/checkbox AP appearance stream helpers ───────────────────────────────

/**
 * Builds the PDF stream content for a circular radio button widget.
 *
 * The outer circle is drawn with a light-gray border + white fill.
 * When `filled=true` a black dot is added at the center (the "on" state).
 *
 * Coordinate space: origin at bottom-left of the BBox [0 0 box box].
 * Uses cubic Bézier curves to approximate a circle (k≈0.5523).
 */
function circleStream(box: number, filled: boolean): Buffer {
  const cx = box / 2;
  const cy = box / 2;
  const r  = box * 0.38;       // outer radius — leaves a tidy margin
  const k  = 0.5523;

  const p = (n: number) => n.toFixed(4);

  function bezierCircle(centerX: number, centerY: number, radius: number): string {
    const rk = radius * k;
    return [
      `${p(centerX + radius)} ${p(centerY)} m`,
      `${p(centerX + radius)} ${p(centerY + rk)} ${p(centerX + rk)} ${p(centerY + radius)} ${p(centerX)} ${p(centerY + radius)} c`,
      `${p(centerX - rk)} ${p(centerY + radius)} ${p(centerX - radius)} ${p(centerY + rk)} ${p(centerX - radius)} ${p(centerY)} c`,
      `${p(centerX - radius)} ${p(centerY - rk)} ${p(centerX - rk)} ${p(centerY - radius)} ${p(centerX)} ${p(centerY - radius)} c`,
      `${p(centerX + rk)} ${p(centerY - radius)} ${p(centerX + radius)} ${p(centerY - rk)} ${p(centerX + radius)} ${p(centerY)} c`,
      'h',
    ].join('\n');
  }

  const lines = [
    'q',
    '0.8 0.8 0.8 RG',   // border: light gray stroke
    '1 w',              // line width: 1pt
    '1 1 1 rg',         // fill: white
    bezierCircle(cx, cy, r),
    'B',                // fill + stroke outer circle
  ];

  if (filled) {
    const dr = r * 0.45;  // dot radius ≈ 45% of outer
    lines.push(
      '0 0 0 rg',         // fill: black dot
      bezierCircle(cx, cy, dr),
      'f',                // fill only (no stroke on dot)
    );
  }

  lines.push('Q');
  return Buffer.from(lines.join('\n') + '\n');
}

export function renderInputChoice(
  node: IRInputChoiceNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  const requiredMark = node.required ? ' *' : '';
  doc.fillColor(MUTED_COLOR)
     .font(node.required ? FONT_BOLD : FONT_REGULAR)
     .fontSize(9)
     .text(`${node.label}${requiredMark}`);
  doc.moveDown(0.2);

  const hint = node.multiple ? 'Select all that apply' : 'Select one';
  doc.fillColor('#aaaaaa')
     .font(FONT_REGULAR)
     .fontSize(8)
     .text(hint);
  doc.moveDown(0.3);

  const leftMargin = doc.page.margins.left + 8;
  const textWidth  = doc.page.width - doc.page.margins.left - doc.page.margins.right - 32;
  const BOX = 11; // widget size in points

  const selectedValues: string[] = Array.isArray(node.value)
    ? [...(node.value as readonly string[])]
    : typeof node.value === 'string' ? [node.value] : [];

  if (node.multiple) {
    // ── Checkboxes — each is its own independent field ────────────────────────
    for (const opt of node.options) {
      const isChecked = selectedValues.includes(opt.value);
      const wy = doc.y;

      doc.formCheckbox(`${node.id}[${opt.value}]`, leftMargin, wy, BOX, BOX, {
        value: isChecked ? 'Yes' : 'Off',
        defaultValue: 'Off',
        backgroundColor: '#ffffff',
        borderColor: BORDER_COLOR,
      } as object);

      // Set appearance state so the checkbox renders correctly before any interaction
      const cbAnnots = (doc.page as unknown as { annotations: Array<{ data: Record<string, unknown> }> }).annotations;
      const cbWidget = cbAnnots[cbAnnots.length - 1];
      if (cbWidget) {
        cbWidget.data['AS'] = new String(isChecked ? 'Yes' : 'Off');
      }

      doc.fillColor(isChecked ? BASE_COLOR : MUTED_COLOR)
         .font(isChecked ? FONT_BOLD : FONT_REGULAR)
         .fontSize(10)
         .text(opt.label, leftMargin + BOX + 6, wy + 1, { width: textWidth });
      doc.moveDown(0.3);
    }
  } else {
    // ── Radio buttons — properly grouped with a manually-created parent field ──
    //
    // We CANNOT use formRadioButton() here. It calls formAnnotation() → annotate()
    // which calls ref.end() immediately (pdfkit line ~4255), serializing the dict
    // to the byte stream before we can strip the child-breaking fields (T/FT/Ff).
    // Post-creation deletes on widget.data are purely in-memory and have no effect
    // on the already-written PDF bytes.
    //
    // Fix: bypass annotate() entirely. Create each child ref via doc.ref() with
    // only the correct fields set up-front, then call ref.end() ourselves once.
    //
    // PDF radio group structure (spec §12.7.4.2):
    //   Parent field: T, FT=/Btn, Ff=0x8000, V=/selectedExportValue, Kids=[...]
    //   Child widgets: Subtype=/Widget, Parent=parentRef, AS=/exportValueOrOff
    //     — child must NOT have T, FT, or Ff (those are inherited from parent)
    //     — child V holds the export value so NeedAppearances=true viewers can
    //       match it against parent V to decide which button shows as selected

    const selectedVal = selectedValues[0];

    type PdfRef = { data: Record<string, unknown>; end: (content?: Buffer) => void };
    type DocInternal = {
      ref: (data: object) => PdfRef;
      _root: { data: { AcroForm: { data: { Fields: unknown[] } } } };
      _convertRect: (x: number, y: number, w: number, h: number) => number[];
    };
    type PageInternal = { annotations: unknown[] };

    const docI = doc as unknown as DocInternal;
    const pageI = doc.page as unknown as PageInternal;

    // Build appearance XObject streams once per group.
    // Each child widget references these via AP.N so viewers use our drawings
    // instead of generating their own (NeedAppearances is false in the AcroForm).
    const apBBox = [0, 0, BOX, BOX];

    const offStream = docI.ref({ Type: 'XObject', Subtype: 'Form', BBox: apBBox, Resources: {} });
    offStream.end(circleStream(BOX, false));

    const onStream = docI.ref({ Type: 'XObject', Subtype: 'Form', BBox: apBBox, Resources: {} });
    onStream.end(circleStream(BOX, true));

    // Parent group field — ended later by endAcroForm()→_endChild() because it
    // has a Kids array (pdfkit's _endChild only ends refs that have Kids).
    //
    // String PRIMITIVES → PDF names (/Btn, /Off, /yes).
    // new String() wrappers → PDF string literals ((fieldId)).
    // V and DV must be names so viewers can match them against AP.N keys.
    const groupRef = docI.ref({
      T:    new String(node.id),          // PDF string — field name must be a string
      FT:   'Btn',                         // PDF name  — /Btn
      Ff:   0x8000,
      V:    selectedVal != null ? selectedVal : 'Off', // PDF name — /yes or /Off
      DV:   'Off',                         // PDF name  — /Off
      Kids: [],
    });
    docI._root.data.AcroForm.data.Fields.push(groupRef);

    for (const opt of node.options) {
      const isSelected = opt.value === selectedVal;
      const wy = doc.y;

      const rect = docI._convertRect(leftMargin, wy, BOX, BOX);
      const childRef = docI.ref({
        Type:    'Annot',
        Subtype: 'Widget',
        F:       4,
        Rect:    rect,
        Border:  [0, 0, 0],
        C:       [0, 0, 0],
        Parent:  groupRef,
        // AS is a PDF name: drives which AP.N key the viewer uses.
        AS:      isSelected ? opt.value : 'Off', // PDF name — /yes or /Off
        // AP.N keys are JS object keys → auto-prefixed with / by pdfkit → PDF names.
        AP:      { N: { Off: offStream, [opt.value]: onStream } },
        MK:      { BG: [1, 1, 1], BC: [0.8, 0.8, 0.8] },
      });

      // Register with page (Annots array) and parent (Kids array)
      pageI.annotations.push(childRef);
      (groupRef.data['Kids'] as unknown[]).push(childRef);
      // Write dict to stream now — before page.end() / groupRef.end()
      childRef.end();

      doc.fillColor(isSelected ? BASE_COLOR : MUTED_COLOR)
         .font(isSelected ? FONT_BOLD : FONT_REGULAR)
         .fontSize(10)
         .text(opt.label, leftMargin + BOX + 6, wy + 1, { width: textWidth });
      doc.moveDown(0.3);
    }
  }

  fieldErrors(doc, node.errors);
  doc.moveDown(FIELD_GAP / 72);
  return ok(undefined);
}

export function renderSubmit(
  node: IRSubmitNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  doc.moveDown(0.5);
  const x = doc.page.margins.left;
  const y = doc.y;
  const w = 140;
  const h = 24;
  doc.roundedRect(x, y, w, h, 4)
     .fill(BTN_COLOR);
  doc.fillColor('#ffffff')
     .font(FONT_BOLD)
     .fontSize(11)
     .text(node.label, x, y + 7, { width: w, align: 'center' });
  doc.y = y + h + SECTION_GAP;
  return ok(undefined);
}

export function renderFormError(
  node: IRFormErrorNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;
  const h = 22;
  doc.roundedRect(x, y, w, h, 3)
     .fillAndStroke('#fff0ee', '#ffb3aa');
  doc.fillColor(ERROR_COLOR)
     .font(FONT_REGULAR)
     .fontSize(10)
     .text(node.message, x + 8, y + 6, { width: w - 16 });
  doc.y = y + h + SECTION_GAP;
  return ok(undefined);
}

export function renderFieldError(
  node: IRFieldErrorNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  doc.fillColor(ERROR_COLOR)
     .font(FONT_REGULAR)
     .fontSize(9)
     .text(`! ${node.message} (${node.fieldId})`);
  doc.moveDown(0.2);
  return ok(undefined);
}

export function renderRepeat(
  node: IRRepeatNode,
  doc: PdfDoc,
  renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  doc.font(FONT_BOLD).fontSize(12).fillColor(BASE_COLOR).text(node.label);
  doc.moveDown(0.3);
  for (const item of node.items) {
    if (node.items.length > 1) {
      doc.font(FONT_REGULAR).fontSize(10).fillColor(MUTED_COLOR)
         .text(`Item ${item.index + 1}`);
      doc.moveDown(0.2);
    }
    const result = renderChildren(item.children, doc);
    if (!result.ok) return result;
  }
  doc.moveDown(SECTION_GAP / 72);
  return ok(undefined);
}

export function renderInputFile(
  node: IRInputFileNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font(FONT_BOLD).fontSize(10).fillColor(BASE_COLOR).text(node.label);
  const y = doc.y;
  doc.roundedRect(x, y, w, 32, 3).stroke(BORDER_COLOR);
  doc.font(FONT_REGULAR).fontSize(9).fillColor(MUTED_COLOR)
     .text('[ File attachment ]', x + 8, y + 11, { width: w - 16 });
  doc.y = y + 32 + FIELD_GAP;
  return ok(undefined);
}

export function renderSignature(
  node: IRSignatureNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font(FONT_BOLD).fontSize(10).fillColor(BASE_COLOR).text(node.label);
  doc.moveDown(0.3);
  const lineY = doc.y;
  doc.moveTo(x, lineY).lineTo(x + w * 0.6, lineY).stroke(BASE_COLOR);
  doc.font(FONT_REGULAR).fontSize(8).fillColor(MUTED_COLOR)
     .text('Signature', x, lineY + 3);
  doc.y = lineY + FIELD_GAP * 2;
  return ok(undefined);
}

export function renderCustom(
  node: IRCustomNode,
  doc: PdfDoc,
  _renderChildren: RenderChildrenFn,
): Result<void, PdfError> {
  const label = node.label !== undefined ? node.label : node.kind;
  doc.font(FONT_REGULAR).fontSize(10).fillColor(MUTED_COLOR)
     .text(`[ Custom field: ${label} ]`);
  doc.moveDown(0.3);
  return ok(undefined);
}
