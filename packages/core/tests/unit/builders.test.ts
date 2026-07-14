import { describe, it, expect } from 'vitest';
import {
  buildContainerNode, buildHeadingNode, buildTextNode,
  buildInputTextNode, buildInputNumberNode, buildInputDateNode,
  buildInputChoiceNode, buildSubmitNode,
  buildFormErrorNode, buildFieldErrorNode,
  buildRepeatItemNode, buildInputFileNode, buildSignatureNode, buildCustomNode,
} from '../../src/builders.js';

describe('buildContainerNode', () => {
  it('applies default direction and gap when absent', () => {
    const node = buildContainerNode({ type: 'container', children: [] }, []);
    expect(node.direction).toBe('column');
    expect(node.gap).toBe('md');
    expect(node.id).toBeUndefined();
  });

  it('cols is undefined when not specified', () => {
    const node = buildContainerNode({ type: 'container', children: [] }, []);
    expect(node.cols).toBeUndefined();
  });

  it('uses provided scalar direction, gap and id', () => {
    const node = buildContainerNode({ type: 'container', id: 'c1', direction: 'row', gap: 'lg', children: [] }, []);
    expect(node.direction).toBe('row');
    expect(node.gap).toBe('lg');
    expect(node.id).toBe('c1');
  });

  it('passes through a responsive direction object unchanged', () => {
    const responsiveDir = { default: 'column' as const, md: 'row' as const };
    const node = buildContainerNode({ type: 'container', direction: responsiveDir, children: [] }, []);
    expect(node.direction).toEqual(responsiveDir);
  });

  it('passes through a responsive gap object unchanged', () => {
    const responsiveGap = { default: 'sm' as const, lg: 'lg' as const };
    const node = buildContainerNode({ type: 'container', gap: responsiveGap, children: [] }, []);
    expect(node.gap).toEqual(responsiveGap);
  });

  it('passes through a scalar cols value', () => {
    const node = buildContainerNode({ type: 'container', cols: 3, children: [] }, []);
    expect(node.cols).toBe(3);
  });

  it('passes through a responsive cols object', () => {
    const responsiveCols = { default: 1, md: 2, lg: 3 };
    const node = buildContainerNode({ type: 'container', cols: responsiveCols, children: [] }, []);
    expect(node.cols).toEqual(responsiveCols);
  });

  it('attaches children', () => {
    const child = buildHeadingNode({ type: 'heading', level: 1, text: 'H' });
    const node = buildContainerNode({ type: 'container', children: [] }, [child]);
    expect(node.children).toHaveLength(1);
  });
});

describe('buildHeadingNode', () => {
  it('applies default size when absent', () => {
    const node = buildHeadingNode({ type: 'heading', level: 2, text: 'Title' });
    expect(node.size).toBe('lg');
    expect(node.level).toBe(2);
  });

  it('uses provided size', () => {
    const node = buildHeadingNode({ type: 'heading', level: 1, text: 'Big', size: 'xl' });
    expect(node.size).toBe('xl');
  });

  it('always has empty children', () => {
    const node = buildHeadingNode({ type: 'heading', level: 1, text: 'H' });
    expect(node.children).toEqual([]);
  });
});

describe('buildTextNode', () => {
  it('applies default weight and intent when absent', () => {
    const node = buildTextNode({ type: 'text', content: 'Hello' });
    expect(node.weight).toBe('normal');
    expect(node.intent).toBe('default');
  });

  it('uses provided weight and intent', () => {
    const node = buildTextNode({ type: 'text', content: 'Alert', weight: 'bold', intent: 'danger' });
    expect(node.weight).toBe('bold');
    expect(node.intent).toBe('danger');
  });
});

describe('buildInputTextNode', () => {
  it('applies required=false default', () => {
    const node = buildInputTextNode({ type: 'input', kind: 'text', id: 'f1', label: 'Name' }, []);
    expect(node.required).toBe(false);
    expect(node.placeholder).toBeUndefined();
    expect(node.minLength).toBeUndefined();
    expect(node.maxLength).toBeUndefined();
  });

  it('uses provided required, placeholder, minLength, maxLength', () => {
    const node = buildInputTextNode(
      { type: 'input', kind: 'text', id: 'f1', label: 'Name', required: true, placeholder: 'Enter', minLength: 2, maxLength: 50 },
      ['Required'],
    );
    expect(node.required).toBe(true);
    expect(node.placeholder).toBe('Enter');
    expect(node.minLength).toBe(2);
    expect(node.maxLength).toBe(50);
    expect(node.errors).toEqual(['Required']);
  });
});

describe('buildInputNumberNode', () => {
  it('applies required=false default and passes errors', () => {
    const node = buildInputNumberNode({ type: 'input', kind: 'number', id: 'age', label: 'Age' }, ['Too low']);
    expect(node.required).toBe(false);
    expect(node.errors).toEqual(['Too low']);
  });

  it('uses provided min and max', () => {
    const node = buildInputNumberNode({ type: 'input', kind: 'number', id: 'age', label: 'Age', min: 0, max: 120 }, []);
    expect(node.min).toBe(0);
    expect(node.max).toBe(120);
  });
});

describe('buildInputDateNode', () => {
  it('applies required=false default', () => {
    const node = buildInputDateNode({ type: 'input', kind: 'date', id: 'dob', label: 'DOB' }, []);
    expect(node.required).toBe(false);
    expect(node.min).toBeUndefined();
    expect(node.max).toBeUndefined();
  });

  it('uses provided min and max dates', () => {
    const node = buildInputDateNode(
      { type: 'input', kind: 'date', id: 'dob', label: 'DOB', min: '1900-01-01', max: '2100-12-31' }, [],
    );
    expect(node.min).toBe('1900-01-01');
    expect(node.max).toBe('2100-12-31');
  });
});

describe('buildInputChoiceNode', () => {
  const opts = [{ value: 'a', label: 'A' }];

  it('applies required=false and multiple=false defaults', () => {
    const node = buildInputChoiceNode({ type: 'input', kind: 'choice', id: 'c', label: 'C', options: opts }, []);
    expect(node.required).toBe(false);
    expect(node.multiple).toBe(false);
  });

  it('uses provided required and multiple', () => {
    const node = buildInputChoiceNode(
      { type: 'input', kind: 'choice', id: 'c', label: 'C', options: opts, required: true, multiple: true }, [],
    );
    expect(node.required).toBe(true);
    expect(node.multiple).toBe(true);
  });
});

describe('buildSubmitNode', () => {
  it('applies empty context default when absent', () => {
    const node = buildSubmitNode({ type: 'submit', id: 's1', label: 'Go', route: '/api' });
    expect(node.context).toEqual({});
  });

  it('uses provided context', () => {
    const ctx = { token: 'abc' };
    const node = buildSubmitNode({ type: 'submit', id: 's1', label: 'Go', route: '/api', context: ctx });
    expect(node.context).toEqual({ token: 'abc' });
  });
});

describe('buildFormErrorNode', () => {
  it('creates a form error node', () => {
    const node = buildFormErrorNode('Something went wrong');
    expect(node.type).toBe('error-form');
    expect(node.message).toBe('Something went wrong');
    expect(node.id).toBeUndefined();
  });
});

describe('buildFieldErrorNode', () => {
  it('creates a field error node', () => {
    const node = buildFieldErrorNode('email', 'Invalid email');
    expect(node.type).toBe('error-field');
    expect(node.fieldId).toBe('email');
    expect(node.message).toBe('Invalid email');
  });
});

describe('buildRepeatItemNode', () => {
  it('creates a repeat-item node with index and children', () => {
    const child = buildHeadingNode({ type: 'heading', level: 1, text: 'H' });
    const node = buildRepeatItemNode(2, [child]);
    expect(node.type).toBe('repeat-item');
    expect(node.index).toBe(2);
    expect(node.children).toHaveLength(1);
  });
});

describe('buildInputFileNode', () => {
  it('applies multiple=false and required=false defaults', () => {
    const node = buildInputFileNode({ type: 'input', kind: 'file', id: 'f1', label: 'Attachment' }, []);
    expect(node.multiple).toBe(false);
    expect(node.required).toBe(false);
    expect(node.accept).toBeUndefined();
  });

  it('uses provided accept, multiple, required, and errors', () => {
    const node = buildInputFileNode(
      { type: 'input', kind: 'file', id: 'f1', label: 'Attachment', accept: '.pdf', multiple: true, required: true },
      ['Required'],
    );
    expect(node.accept).toBe('.pdf');
    expect(node.multiple).toBe(true);
    expect(node.required).toBe(true);
    expect(node.errors).toEqual(['Required']);
  });
});

describe('buildSignatureNode', () => {
  it('applies required=false default', () => {
    const node = buildSignatureNode({ type: 'signature', id: 'sig1', label: 'Sign here' }, []);
    expect(node.required).toBe(false);
  });

  it('uses provided required and errors', () => {
    const node = buildSignatureNode(
      { type: 'signature', id: 'sig1', label: 'Sign here', required: true },
      ['Required'],
    );
    expect(node.required).toBe(true);
    expect(node.errors).toEqual(['Required']);
  });
});

describe('buildCustomNode', () => {
  it('applies empty props default', () => {
    const node = buildCustomNode({ type: 'custom', kind: 'rating', id: 'cu1' }, []);
    expect(node.props).toEqual({});
    expect(node.label).toBeUndefined();
  });

  it('uses provided label, props, and errors', () => {
    const node = buildCustomNode(
      { type: 'custom', kind: 'rating', id: 'cu1', label: 'Rate us', props: { max: 5 } },
      ['Required'],
    );
    expect(node.label).toBe('Rate us');
    expect(node.props).toEqual({ max: 5 });
    expect(node.errors).toEqual(['Required']);
  });
});
