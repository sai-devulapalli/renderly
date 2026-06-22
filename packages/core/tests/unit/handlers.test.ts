import { describe, it, expect } from 'vitest';
import { err } from '@renderly/shared';
import type { Element, IRNode, FormErrors } from '@renderly/schema';
import type { HandlerContext } from '../../src/types.js';
import {
  containerHandler, headingHandler, textHandler,
  textInputHandler, numberInputHandler, dateInputHandler,
  choiceInputHandler, submitHandler,
} from '../../src/handlers.js';

function makeContext(errors?: FormErrors): HandlerContext {
  return {
    errors,
    walkChildren: (children) => {
      const nodes: IRNode[] = children.map(() => ({
        type: 'text' as const, id: undefined, content: 'child',
        weight: 'normal' as const, intent: 'default' as const, children: [],
      }));
      return { ok: true, value: nodes };
    },
  };
}

function failingContext(): HandlerContext {
  return {
    errors: undefined,
    walkChildren: () => err({ code: 'UNREGISTERED_ELEMENT_TYPE', elementType: 'unknown' }),
  };
}

describe('containerHandler', () => {
  it('returns ok with children from context', () => {
    const el: Element = { type: 'container', children: [{ type: 'text', content: 'x' }] };
    const result = containerHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.type).toBe('container');
      expect(result.value.children).toHaveLength(1);
    }
  });

  it('propagates walkChildren error', () => {
    const el: Element = { type: 'container', children: [{ type: 'text', content: 'x' }] };
    const result = containerHandler(el, failingContext());
    expect(result.ok).toBe(false);
  });
});

describe('headingHandler', () => {
  it('returns ok with heading node', () => {
    const el: Element = { type: 'heading', level: 1, text: 'Hello' };
    const result = headingHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.type).toBe('heading');
  });
});

describe('textHandler', () => {
  it('returns ok with text node', () => {
    const el: Element = { type: 'text', content: 'World' };
    const result = textHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.type).toBe('text');
  });
});

describe('textInputHandler', () => {
  it('returns ok with empty errors when no FormErrors present', () => {
    const el: Element = { type: 'input', kind: 'text', id: 'f1', label: 'Name' };
    const result = textInputHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) {
      const node = result.value as { errors: string[] };
      expect(node.errors).toEqual([]);
    }
  });

  it('returns ok with field errors when FormErrors present', () => {
    const el: Element = { type: 'input', kind: 'text', id: 'f1', label: 'Name' };
    const result = textInputHandler(el, makeContext({ fields: { f1: ['Required'] } }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const node = result.value as { errors: string[] };
      expect(node.errors).toEqual(['Required']);
    }
  });
});

describe('numberInputHandler', () => {
  it('returns empty errors without context errors', () => {
    const el: Element = { type: 'input', kind: 'number', id: 'age', label: 'Age' };
    const result = numberInputHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value as { errors: string[] }).errors).toEqual([]);
  });

  it('returns field errors from context', () => {
    const el: Element = { type: 'input', kind: 'number', id: 'age', label: 'Age' };
    const result = numberInputHandler(el, makeContext({ fields: { age: ['Too small'] } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value as { errors: string[] }).errors).toEqual(['Too small']);
  });
});

describe('dateInputHandler', () => {
  it('returns empty errors without context errors', () => {
    const el: Element = { type: 'input', kind: 'date', id: 'dob', label: 'DOB' };
    const result = dateInputHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value as { errors: string[] }).errors).toEqual([]);
  });

  it('returns field errors from context', () => {
    const el: Element = { type: 'input', kind: 'date', id: 'dob', label: 'DOB' };
    const result = dateInputHandler(el, makeContext({ fields: { dob: ['Invalid date'] } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value as { errors: string[] }).errors).toEqual(['Invalid date']);
  });
});

describe('choiceInputHandler', () => {
  const opts = [{ value: 'a', label: 'A' }];

  it('returns empty errors without context errors', () => {
    const el: Element = { type: 'input', kind: 'choice', id: 'c', label: 'C', options: opts };
    const result = choiceInputHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value as { errors: string[] }).errors).toEqual([]);
  });

  it('returns field errors from context', () => {
    const el: Element = { type: 'input', kind: 'choice', id: 'c', label: 'C', options: opts };
    const result = choiceInputHandler(el, makeContext({ fields: { c: ['Select one'] } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value as { errors: string[] }).errors).toEqual(['Select one']);
  });
});

describe('submitHandler', () => {
  it('returns ok with submit node', () => {
    const el: Element = { type: 'submit', id: 's1', label: 'Submit', route: '/api' };
    const result = submitHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.type).toBe('submit');
  });
});
