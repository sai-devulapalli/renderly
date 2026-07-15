import type { Document, Element, FieldValues, FormErrors, IRNode } from '@renderly/schema';
import { ok, err, isOk } from '@renderly/shared';
import type { Logger, Result } from '@renderly/shared';
import type { WalkError, WalkScope } from './types.js';
import { createRegistry, elementKey } from './registry.js';
import type { Registry } from './registry.js';
import { buildFormErrorNode } from './builders.js';
import { ALL_HANDLERS } from './handlers.js';
import { applyRules } from './rules.js';

/** Bounds container/repeat nesting so a malicious or malformed document can't overflow the call stack. */
export const DEFAULT_MAX_DEPTH = 200;

export interface WalkOptions {
  readonly logger?: Logger;
  /** Current form field values used to evaluate conditional rules. When absent all rules are skipped. */
  readonly values?: FieldValues;
  /** Maximum container/repeat nesting depth before walking fails with MAX_DEPTH_EXCEEDED. Defaults to DEFAULT_MAX_DEPTH. */
  readonly maxDepth?: number;
}

function withRequiredOverride(node: IRNode, override: boolean): IRNode {
  if (
    node.type !== 'input-text' &&
    node.type !== 'input-number' &&
    node.type !== 'input-date' &&
    node.type !== 'input-choice'
  ) return node;
  return { ...node, required: override };
}

function walkElements(
  elements: readonly Element[],
  registry: Registry,
  errors: FormErrors | undefined,
  logger: Logger | undefined,
  values: FieldValues | undefined,
  depth: number,
  maxDepth: number,
): Result<IRNode[], WalkError> {
  const nodes: IRNode[] = [];

  function walkChildrenOf(element: Element) {
    return (children: readonly Element[], scope?: WalkScope): Result<IRNode[], WalkError> => {
      if (depth >= maxDepth) {
        return err({ code: 'MAX_DEPTH_EXCEEDED', elementType: element.type });
      }
      return walkElements(
        children,
        registry,
        scope?.errors ?? errors,
        logger,
        scope?.values ?? values,
        depth + 1,
        maxDepth,
      );
    };
  }

  for (const element of elements) {
    const key = elementKey(element);

    // Evaluate conditional rules when values context is provided
    if (element.rules !== undefined && element.rules.length > 0 && values !== undefined) {
      const effect = applyRules(element.rules, values);
      if (!effect.visible) {
        logger?.debug('walk:element:hidden', { type: key });
        continue;
      }

      logger?.debug('walk:element', { type: key });

      const resolved = registry.resolve(element);
      if (!isOk(resolved)) {
        logger?.warn('walk:unregistered', { code: resolved.error.code, elementType: element.type });
        return resolved;
      }

      const nodeResult = resolved.value(element, {
        errors,
        values,
        walkChildren: walkChildrenOf(element),
      });
      if (!isOk(nodeResult)) {
        logger?.warn('walk:handler-failed', { code: nodeResult.error.code, elementType: element.type });
        return nodeResult;
      }

      const node = effect.requiredOverride !== undefined
        ? withRequiredOverride(nodeResult.value, effect.requiredOverride)
        : nodeResult.value;
      nodes.push(node);
      continue;
    }

    logger?.debug('walk:element', { type: key });

    const resolved = registry.resolve(element);
    if (!isOk(resolved)) {
      logger?.warn('walk:unregistered', { code: resolved.error.code, elementType: element.type });
      return resolved;
    }

    const nodeResult = resolved.value(element, {
      errors,
      values,
      walkChildren: walkChildrenOf(element),
    });
    if (!isOk(nodeResult)) {
      logger?.warn('walk:handler-failed', { code: nodeResult.error.code, elementType: element.type });
      return nodeResult;
    }

    nodes.push(nodeResult.value);
  }

  return ok(nodes);
}

export function walk(
  doc: Document,
  registry: Registry,
  opts?: WalkOptions,
): Result<IRNode[], WalkError> {
  const logger = opts?.logger;
  const values = opts?.values;
  const maxDepth = opts?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const t0 = Date.now();

  logger?.debug('walk:start', { elementCount: doc.elements.length });

  const bodyResult = walkElements(doc.elements, registry, doc.errors, logger, values, 0, maxDepth);
  if (!isOk(bodyResult)) return bodyResult;

  const nodes: IRNode[] = [];

  if (doc.errors?.form !== undefined && doc.errors.form.length > 0) {
    for (const message of doc.errors.form) {
      nodes.push(buildFormErrorNode(message));
    }
  }

  nodes.push(...bodyResult.value);

  logger?.debug('walk:complete', { nodeCount: nodes.length, durationMs: Date.now() - t0 });
  return ok(nodes);
}

export function createDefaultRegistry(): Registry {
  const registry = createRegistry();
  for (const [key, handler] of ALL_HANDLERS) {
    registry.register(key, handler);
  }
  return registry;
}
