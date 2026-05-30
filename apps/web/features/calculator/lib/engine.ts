/**
 * Safe recursive-descent expression parser and evaluator.
 * No eval() — fully hand-written tokenizer + parser.
 *
 * Grammar:
 *   expr    → additive
 *   additive → multiplicative ( ('+' | '-') multiplicative )*
 *   multiplicative → power ( ('*' | '/') power )* [with implicit-mul for id and '(']
 *   power → unary ( '^' unary )*   [right-associative]
 *   unary → '-' unary | postfix
 *   postfix → primary ( '%' | '!' )?
 *   primary → NUM | CONST | FUNC '(' args ')' | '(' expr ')'
 */

import type { AngleUnit } from '../types/calculator';
import { lex } from './engineTokenizer';
import { Parser } from './engineParser';

export class EvalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvalError';
    }
}

/** Evaluate a math expression string. Throws EvalError on invalid input. */
export function evaluate(expression: string, unit: AngleUnit = 'deg'): number {
    if (!expression.trim()) throw new EvalError('Empty expression');
    try {
        const tokens = lex(expression);
        const result = new Parser(tokens, unit).parse();
        if (!isFinite(result)) {
            if (isNaN(result)) throw new EvalError('Result is not a number');
            throw new EvalError(
                'Result is infinity. Check for division by zero or overflow.',
            );
        }
        return result;
    } catch (e) {
        if (e instanceof EvalError) throw e;
        throw new EvalError(
            e instanceof Error ? e.message : 'Invalid expression',
        );
    }
}

/** Format a numeric result with given decimal precision (trailing zeros stripped). */
export function formatResult(value: number, precision = 10): string {
    if (!isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    if (isNaN(value)) return 'NaN';
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e15 || abs < 1e-7)) {
        return value.toPrecision(precision).replace(/\.?0+(e)/, '$1');
    }
    return value
        .toFixed(precision)
        .replace(/(\.\d*?)0+$/, '$1')
        .replace(/\.$/, '');
}

/** Returns null if valid, or an error message if invalid. */
export function validateExpression(
    expression: string,
    unit: AngleUnit = 'deg',
): string | null {
    try {
        evaluate(expression, unit);
        return null;
    } catch (e) {
        return e instanceof Error ? e.message : 'Invalid expression';
    }
}

/** Check if a partial expression is structurally completable (balanced parens etc.) */
export function isExpressionComplete(expression: string): boolean {
    let depth = 0;
    for (const ch of expression) {
        if (ch === '(') depth++;
        else if (ch === ')') {
            depth--;
            if (depth < 0) return false;
        }
    }
    return depth === 0;
}

/** Auto-close unclosed parentheses. */
export function autoClose(expression: string): string {
    let depth = 0;
    for (const ch of expression) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
    }
    return expression + ')'.repeat(Math.max(0, depth));
}

/** Remove the last "unit" from an expression (last char, or last function call). */
export function backspaceExpression(expression: string): string {
    if (!expression) return '';
    const fnMatch = expression.match(/([a-zA-Z]+\()$/);
    if (fnMatch?.[1]) return expression.slice(0, -fnMatch[1].length);
    return expression.slice(0, -1);
}

/** Get step-by-step breakdown tokens for display. */
export function tokenizeForDisplay(expression: string): string[] {
    try {
        return lex(expression)
            .filter((t) => t.kind !== 'eof')
            .map((t) => t.raw);
    } catch {
        return [expression];
    }
}
