import type { Document, Element } from '@renderly/schema';

export interface LintIssue {
  readonly code: 'DEAD_RULE' | 'DUPLICATE_FIELD_ID' | 'ORPHAN_FIELD_REF';
  readonly severity: 'error' | 'warning';
  readonly elementId?: string;
  readonly message: string;
}

function collectFieldIds(elements: readonly Element[], ids: Set<string>): void {
  for (const el of elements) {
    if (el.id !== undefined) ids.add(el.id);
    if (el.type === 'container') collectFieldIds(el.children, ids);
  }
}

function collectDuplicates(elements: readonly Element[], seen: Set<string>, issues: LintIssue[]): void {
  for (const el of elements) {
    if (el.id !== undefined) {
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
    if (el.type === 'container') collectDuplicates(el.children, seen, issues);
  }
}

function checkRules(elements: readonly Element[], fieldIds: Set<string>, issues: LintIssue[]): void {
  for (const el of elements) {
    for (const rule of el.rules ?? []) {
      const field = rule.when.field;
      if (!fieldIds.has(field)) {
        issues.push({
          code: 'DEAD_RULE',
          severity: 'warning',
          elementId: el.id,
          message: `Rule references field "${field}" which does not exist in this document.`,
        });
      }
    }
    if (el.type === 'container') checkRules(el.children, fieldIds, issues);
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
