import type { FieldValues } from '@renderly/schema';

/**
 * Safe arithmetic expression evaluator.
 *
 * Supported: numeric literals, field references (bare identifiers),
 * +  -  *  /  %  operators, parentheses.
 *
 * Returns undefined when:
 *   - A referenced field is missing or non-numeric
 *   - Division by zero
 *   - The expression is syntactically invalid
 */

type Token =
  | { type: 'num'; value: number }
  | { type: 'id'; name: string }
  | { type: 'op'; op: '+' | '-' | '*' | '/' | '%' }
  | { type: 'lparen' }
  | { type: 'rparen' };

function tokenize(expr: string): Token[] | undefined {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i] as string;
    if (ch === ' ' || ch === '\t') { i++; continue; }
    if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }
    if ('+-*/%'.includes(ch)) {
      tokens.push({ type: 'op', op: ch as '+' | '-' | '*' | '/' | '%' });
      i++;
      continue;
    }
    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = '';
      while (i < expr.length && ((expr[i] as string) >= '0' && (expr[i] as string) <= '9' || expr[i] === '.')) {
        num += expr[i++];
      }
      const v = parseFloat(num);
      if (isNaN(v)) return undefined;
      tokens.push({ type: 'num', value: v });
      continue;
    }
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let name = '';
      while (i < expr.length) {
        const c = expr[i] as string;
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_') {
          name += c; i++;
        } else break;
      }
      tokens.push({ type: 'id', name });
      continue;
    }
    return undefined;
  }
  return tokens;
}

// Recursive descent parser — additive / multiplicative / unary / primary

interface Parser {
  tokens: Token[];
  pos: number;
  values: FieldValues;
}

function peek(p: Parser): Token | undefined {
  return p.tokens[p.pos];
}

function consume(p: Parser): Token | undefined {
  return p.tokens[p.pos++];
}

function parseExpr(p: Parser): number | undefined {
  return parseAdditive(p);
}

function parseAdditive(p: Parser): number | undefined {
  let left = parseMultiplicative(p);
  if (left === undefined) return undefined;
  while (true) {
    const t = peek(p);
    if (t?.type === 'op' && (t.op === '+' || t.op === '-')) {
      consume(p);
      const right = parseMultiplicative(p);
      if (right === undefined) return undefined;
      left = t.op === '+' ? left + right : left - right;
    } else break;
  }
  return left;
}

function parseMultiplicative(p: Parser): number | undefined {
  let left = parseUnary(p);
  if (left === undefined) return undefined;
  while (true) {
    const t = peek(p);
    if (t?.type === 'op' && (t.op === '*' || t.op === '/' || t.op === '%')) {
      consume(p);
      const right = parseUnary(p);
      if (right === undefined) return undefined;
      if (t.op === '/') {
        if (right === 0) return undefined;
        left = left / right;
      } else if (t.op === '%') {
        if (right === 0) return undefined;
        left = left % right;
      } else {
        left = left * right;
      }
    } else break;
  }
  return left;
}

function parseUnary(p: Parser): number | undefined {
  const t = peek(p);
  if (t?.type === 'op' && t.op === '-') {
    consume(p);
    const v = parsePrimary(p);
    return v !== undefined ? -v : undefined;
  }
  return parsePrimary(p);
}

function parsePrimary(p: Parser): number | undefined {
  const t = consume(p);
  if (t === undefined) return undefined;
  if (t.type === 'num') return t.value;
  if (t.type === 'id') {
    const raw = p.values[t.name];
    if (raw === undefined) return undefined;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return isNaN(n) ? undefined : n;
  }
  if (t.type === 'lparen') {
    const v = parseExpr(p);
    const close = consume(p);
    if (close?.type !== 'rparen') return undefined;
    return v;
  }
  return undefined;
}

/** Evaluate a safe arithmetic expression against a FieldValues context. */
export function evaluateExpr(expr: string, values: FieldValues): number | undefined {
  const tokens = tokenize(expr);
  if (tokens === undefined) return undefined;
  const parser: Parser = { tokens, pos: 0, values };
  const result = parseExpr(parser);
  if (parser.pos !== parser.tokens.length) return undefined;
  return result;
}

export function formatComputedValue(
  value: number | undefined,
  format: 'number' | 'currency' | 'percent',
): string {
  if (value === undefined) return '—';
  if (format === 'currency') return `$${value.toFixed(2)}`;
  if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}
