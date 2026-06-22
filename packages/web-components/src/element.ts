import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry, deriveItemCount } from '@renderly/core';
import { renderDocument } from '@renderly/html';
import type { Document, FieldValue, FieldValues, FormErrors } from '@renderly/schema';
import type { WcError } from './errors.js';
import type { RenderlySubmitDetail, SubmitValues } from './types.js';

/**
 * <renderly-form> — renders a Renderly document as an interactive HTML form.
 *
 * Attributes:
 *   schema   JSON string of the Renderly document (parsed on set)
 *
 * Properties (JS-only, not reflected as attributes):
 *   schema   string | object — also settable as an HTML attribute
 *   values   FieldValues     — current field values; triggers re-render on set
 *   errors   FormErrors | null — validation errors to display; triggers re-render
 *
 * Events:
 *   renderly-submit   CustomEvent<{ values: SubmitValues }>  — form submitted
 *   renderly-error    CustomEvent<WcError>                   — parse/walk/render failed
 *
 * Usage:
 *   <renderly-form id="f" schema='{"version":"1.0","elements":[]}'></renderly-form>
 *
 *   const el = document.getElementById('f');
 *   el.values = { first_name: 'Jane' };
 *   el.addEventListener('renderly-submit', e => console.log(e.detail.values));
 */
export class RenderlyFormElement extends HTMLElement {
  static readonly observedAttributes = ['schema'] as const;

  #doc: Document | null = null;
  #values: FieldValues = {};
  #errors: FormErrors | null = null;
  #container: HTMLDivElement | null = null;
  #abort: AbortController | null = null;

  // ── lifecycle ──────────────────────────────────────────────────────────────

  connectedCallback(): void {
    this.#container = this.ownerDocument.createElement('div');
    this.appendChild(this.#container);

    this.#abort = new AbortController();
    this.#container.addEventListener('submit', this.#onSubmit, {
      capture: true,
      signal: this.#abort.signal,
    });
    this.#container.addEventListener('click', this.#onRepeatClick, {
      signal: this.#abort.signal,
    });

    this.#render();
  }

  disconnectedCallback(): void {
    this.#abort?.abort();
    this.#container?.remove();
    this.#container = null;
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    next: string | null,
  ): void {
    if (name !== 'schema') return;

    if (next === null) {
      this.#doc = null;
      if (this.#container) this.#container.innerHTML = '';
      return;
    }

    const result = parseDocument(next);
    if (result.ok) {
      this.#doc = result.value;
    } else {
      this.#doc = null;
      this.#emitError({ code: 'PARSE_ERROR', cause: result.error });
    }
    this.#render();
  }

  // ── public properties ──────────────────────────────────────────────────────

  /** Set the document schema from a JSON string or a pre-parsed object. */
  set schema(value: string | object) {
    this.setAttribute(
      'schema',
      typeof value === 'string' ? value : JSON.stringify(value),
    );
  }

  /** Current field values. Setting this triggers a synchronous re-render. */
  set values(v: FieldValues) {
    this.#values = v;
    this.#render();
  }

  get values(): FieldValues {
    return this.#values;
  }

  /** Validation errors. Setting this triggers a synchronous re-render. */
  set errors(v: FormErrors | null) {
    this.#errors = v;
    this.#render();
  }

  get errors(): FormErrors | null {
    return this.#errors;
  }

  // ── internals ──────────────────────────────────────────────────────────────

  #render(): void {
    if (!this.#container || !this.#doc) return;

    // Merge in-flight errors (e.g. server-side validation) into the document
    // without mutating the stored #doc so resetting errors triggers a clean render.
    const doc: Document = this.#errors
      ? { ...this.#doc, errors: this.#errors }
      : this.#doc;

    const nodesResult = walk(doc, createDefaultRegistry(), { values: this.#values });
    if (!nodesResult.ok) {
      this.#emitError({ code: 'WALK_ERROR', cause: nodesResult.error });
      return;
    }

    const htmlResult = renderDocument(nodesResult.value);
    if (!htmlResult.ok) {
      this.#emitError({ code: 'RENDER_ERROR', cause: htmlResult.error });
      return;
    }

    // Wrap in a native <form> so the submit event fires and FormData works.
    this.#container.innerHTML =
      `<form class="renderly-form__inner" novalidate>${htmlResult.value}</form>`;
  }

  #onSubmit = (e: Event): void => {
    e.preventDefault();

    const raw = new FormData(e.target as HTMLFormElement);
    const values: Record<string, FieldValue> = {};

    for (const [key, val] of raw.entries()) {
      if (typeof val !== 'string') continue;
      const existing = values[key];
      if (existing === undefined) {
        values[key] = val;
      } else if (Array.isArray(existing)) {
        (existing as string[]).push(val);
      } else {
        values[key] = [existing as string, val];
      }
    }

    this.dispatchEvent(
      new CustomEvent<RenderlySubmitDetail>('renderly-submit', {
        detail: { values: values as SubmitValues },
        bubbles: true,
        composed: true,
      }),
    );
  };

  #onRepeatClick = (e: Event): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!btn) return;
    const action = btn.dataset['action'];
    const id = btn.dataset['target'];
    if (!id) return;
    if (action === 'repeat-add') {
      e.preventDefault();
      this.#repeatAdd(id);
    } else if (action === 'repeat-remove') {
      e.preventDefault();
      const idx = parseInt(btn.dataset['index'] ?? '', 10);
      if (!isNaN(idx)) this.#repeatRemove(id, idx);
    }
  };

  #repeatAdd(id: string): void {
    const current = deriveItemCount(id, this.#values, 1);
    this.#values = { ...this.#values, [`${id}.__items`]: String(current + 1) };
    this.#render();
  }

  #repeatRemove(id: string, index: number): void {
    const current = deriveItemCount(id, this.#values, 1);
    const newValues: Record<string, FieldValue> = {};
    const prefix = `${id}[`;
    for (const [key, val] of Object.entries(this.#values)) {
      if (val === undefined) continue;
      if (!key.startsWith(prefix)) {
        newValues[key] = val;
        continue;
      }
      const bracket = key.indexOf(']', prefix.length);
      if (bracket === -1) { newValues[key] = val; continue; }
      const keyIdx = parseInt(key.slice(prefix.length, bracket), 10);
      if (isNaN(keyIdx) || keyIdx === index) continue;
      const suffix = key.slice(bracket + 1);
      newValues[`${id}[${keyIdx > index ? keyIdx - 1 : keyIdx}]${suffix}`] = val;
    }
    newValues[`${id}.__items`] = String(Math.max(0, current - 1));
    this.#values = newValues;
    this.#render();
  }

  #emitError(error: WcError): void {
    this.dispatchEvent(
      new CustomEvent<WcError>('renderly-error', {
        detail: error,
        bubbles: true,
        composed: true,
      }),
    );
  }
}
