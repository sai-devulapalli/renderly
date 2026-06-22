import type {
  IRNode,
  IRHeadingNode,
  IRInputChoiceNode,
  IRSubmitNode,
} from '@renderly/schema';
import type { A11yViolation } from './types.js';

interface AuditState {
  violations: A11yViolation[];
  seenIds: Set<string>;
  lastHeadingLevel: number;
}

function push(state: AuditState, v: Omit<A11yViolation, never>): void {
  state.violations.push(v);
}

function auditNode(node: IRNode, state: AuditState): void {
  // Track duplicate IDs across the entire tree
  if (node.id !== undefined) {
    if (state.seenIds.has(node.id)) {
      push(state, {
        code: 'DUPLICATE_ID',
        nodeType: node.type,
        id: node.id,
        message: `Duplicate id "${node.id}" — each element id must be unique within a document.`,
        severity: 'error',
      });
    } else {
      state.seenIds.add(node.id);
    }
  }

  switch (node.type) {
    case 'heading': {
      const h = node as IRHeadingNode;
      const expectedMax = state.lastHeadingLevel + 1;
      if (state.lastHeadingLevel > 0 && h.level > expectedMax) {
        push(state, {
          code: 'HEADING_SKIP',
          nodeType: 'heading',
          id: h.id,
          message: `Heading level skipped: h${state.lastHeadingLevel} → h${h.level} (expected at most h${expectedMax}).`,
          severity: 'warning',
        });
      }
      state.lastHeadingLevel = h.level;
      // Recurse into heading children (IRHeadingNode has children: readonly IRNode[])
      for (const child of node.children) auditNode(child, state);
      break;
    }

    case 'container': {
      for (const child of node.children) auditNode(child, state);
      break;
    }

    case 'input-choice': {
      const c = node as IRInputChoiceNode;
      if (c.options.length === 0) {
        push(state, {
          code: 'EMPTY_CHOICE_OPTIONS',
          nodeType: 'input-choice',
          id: c.id,
          message: `Choice field "${c.id}" has no options — users cannot select a value.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'submit': {
      const s = node as IRSubmitNode;
      if (s.label.trim().length === 0) {
        push(state, {
          code: 'EMPTY_SUBMIT_LABEL',
          nodeType: 'submit',
          id: s.id,
          message: `Submit button "${s.id}" has an empty label — screen readers cannot announce its purpose.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'input-text':
    case 'input-number':
    case 'input-date': {
      const label = (node as { label: string }).label;
      if (label.trim().length === 0) {
        push(state, {
          code: 'MISSING_FIELD_LABEL',
          nodeType: node.type,
          id: (node as { id: string }).id,
          message: `Input field "${(node as { id: string }).id}" has an empty label — screen readers cannot describe it.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'text':
    case 'error-form':
    case 'error-field':
      break;
  }
}

/**
 * Audit an IR node array for accessibility violations.
 * Recurses into container and heading children.
 */
export function auditNodes(nodes: readonly IRNode[]): A11yViolation[] {
  const state: AuditState = { violations: [], seenIds: new Set(), lastHeadingLevel: 0 };

  if (nodes.length === 0) {
    state.violations.push({
      code: 'EMPTY_FORM',
      nodeType: 'document',
      message: 'The form contains no renderable nodes.',
      severity: 'warning',
    });
    return state.violations;
  }

  for (const node of nodes) {
    auditNode(node, state);
  }

  return state.violations;
}
