import type { IRNode } from '@renderly/schema';
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
      const expectedMax = state.lastHeadingLevel + 1;
      if (state.lastHeadingLevel > 0 && node.level > expectedMax) {
        push(state, {
          code: 'HEADING_SKIP',
          nodeType: 'heading',
          id: node.id,
          message: `Heading level skipped: h${state.lastHeadingLevel} → h${node.level} (expected at most h${expectedMax}).`,
          severity: 'warning',
        });
      }
      state.lastHeadingLevel = node.level;
      for (const child of node.children) auditNode(child, state);
      break;
    }

    case 'container': {
      for (const child of node.children) auditNode(child, state);
      break;
    }

    case 'input-choice': {
      if (node.options.length === 0) {
        push(state, {
          code: 'EMPTY_CHOICE_OPTIONS',
          nodeType: 'input-choice',
          id: node.id,
          message: `Choice field "${node.id}" has no options — users cannot select a value.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'submit': {
      if (node.label.trim().length === 0) {
        push(state, {
          code: 'EMPTY_SUBMIT_LABEL',
          nodeType: 'submit',
          id: node.id,
          message: `Submit button "${node.id}" has an empty label — screen readers cannot announce its purpose.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'input-text':
    case 'input-number':
    case 'input-date': {
      if (node.label.trim().length === 0) {
        push(state, {
          code: 'MISSING_FIELD_LABEL',
          nodeType: node.type,
          id: node.id,
          message: `Input field "${node.id}" has an empty label — screen readers cannot describe it.`,
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
