import type { Document, Element } from '@renderly/schema';

export interface LintIssue {
  readonly code: 'DEAD_RULE' | 'DUPLICATE_FIELD_ID' | 'ORPHAN_FIELD_REF';
  readonly severity: 'error' | 'warning';
  readonly elementId?: string;
  readonly message: string;
}

function collectFieldIds(elements: readonly Element[], ids: Set<string>): void {
  for (const el of elements) {
    if ('id' in el && typeof el.id === 'string') {
      ids.add(el.id);
    }
    if (el.type === 'container' && Array.isArray(el.children)) {
      collectFieldIds(el.children as readonly Element[], ids);
    }
  }
}

function collectDuplicates(elements: readonly Element[], seen: Set<string>, issues: LintIssue[]): void {
  for (const el of elements) {
    if ('id' in el && typeof el.id === 'string') {
      if (seen.has(el.id)) {
        issues.push({
          code: 'DUPLICATE_FIELD_ID',
          severity: 'error',
          elementId: el.id,
          message: `Duplicate field ID "${el.id}" — field IDs must be unique within a document.`,
        });
      } else {
        seen.add(el.id);
      }
    }
    if (el.type === 'container' && Array.isArray(el.children)) {
      collectDuplicates(el.children as readonly Element[], seen, issues);
    }
  }
}

function checkRules(elements: readonly Element[], fieldIds: Set<string>, issues: LintIssue[]): void {
  for (const el of elements) {
    const rules = (el as { rules?: unknown[] }).rules;
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const cond = (rule as { when?: { field?: string } }).when;
        if (cond?.field && !fieldIds.has(cond.field)) {
          issues.push({
            code: 'DEAD_RULE',
            severity: 'warning',
            elementId: (el as { id?: string }).id,
            message: `Rule references field "${cond.field}" which does not exist in this document.`,
          });
        }
      }
    }
    if (el.type === 'container' && Array.isArray(el.children)) {
      checkRules(el.children as readonly Element[], fieldIds, issues);
    }
  }
}

export function lintDocument(doc: Document): LintIssue[] {
  const issues: LintIssue[] = [];
  const fieldIds = new Set<string>();
  collectFieldIds(doc.elements, fieldIds);
  collectDuplicates(doc.elements, new Set<string>(), issues);
  checkRules(doc.elements, fieldIds, issues);
  return issues;
}
