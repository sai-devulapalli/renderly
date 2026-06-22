import type { Element } from '@renderly/schema';
import { err, ok } from '@renderly/shared';
import type { ElementHandler, WalkError } from './types.js';

export interface Registry {
  register(key: string, handler: ElementHandler): void;
  resolve(element: Element): import('@renderly/shared').Result<ElementHandler, WalkError>;
}

export function elementKey(element: Element): string {
  if (element.type === 'input') return `input:${element.kind}`;
  return element.type;
}

export function createRegistry(): Registry {
  const map = new Map<string, ElementHandler>();

  return {
    register(key, handler) {
      map.set(key, handler);
    },

    resolve(element) {
      const key = elementKey(element);
      const handler = map.get(key);
      if (handler === undefined) {
        return err<WalkError>({
          code: 'UNREGISTERED_ELEMENT_TYPE',
          elementType: key,
        });
      }
      return ok(handler);
    },
  };
}
