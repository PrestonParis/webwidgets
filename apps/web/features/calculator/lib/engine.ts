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

import type { AngleUnit } from '../types';

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type TK =
    | 'num'
    | 'id'
    | '+'
    | '-'
    | '*'
    | '/'
    | '^'
    | '%'
    | '!'
    | '('
    | ')'
    | ','
    | 'eof';

interface Token {
    kind: TK;
    raw: string;
    num?: number;
}

function lex(src: string): Token[] {
    const tokens: Token[] = [];
    const s = src.replace(/\s+/g, ' ').trim();
    let i = 0;

    while (i < s.length) {
        const ch = s[i]!;

        if (ch === ' ') {
            i++;
            continue;
        }

        // Numbers (including decimals and scientific notation)
        if (
            /[0-9]/.test(ch) ||
            (ch === '.' && i + 1 < s.length && /[0-9]/.test(s[i + 1]!))
        ) {
            let raw = '';
            while (i < s.length && /[0-9.]/.test(s[i]!)) raw += s[i++];
            // optional scientific notation suffix: e+3 / e-3 / e3
            if (i < s.length && /[eE]/.test(s[i]!)) {
                const saved = i;
                let sci = s[i++]!;
                if (i < s.length && /[+\-]/.test(s[i]!)) sci += s[i++];
                if (i < s.length && /[0-9]/.test(s[i]!)) {
                    while (i < s.length && /[0-9]/.test(s[i]!)) sci += s[i++];
                    raw += sci;
                } else {
                    i = saved; // roll back — 'e' belongs to next token (constant)
                }
            }
            const num = parseFloat(raw);
            if (isNaN(num)) throw new EvalError(`Invalid number: ${raw}`);
            tokens.push({ kind: 'num', raw, num });
            continue;
        }

        // Identifiers: function names and constants
        if (/[a-zA-Zπτφ]/.test(ch)) {
            let id = '';
            while (i < s.length && /[a-zA-Z0-9πτφ_]/.test(s[i]!)) id += s[i++];
            tokens.push({ kind: 'id', raw: id });
            continue;
        }

        // Unicode arithmetic aliases and standard operators
        const OPS: Record<string, TK> = {
            '+': '+',
            '-': '-',
            '−': '-',
            '–': '-',
            '*': '*',
            '×': '*',
            '·': '*',
            '/': '/',
            '÷': '/',
            '^': '^',
            '%': '%',
            '!': '!',
            '(': '(',
            ')': ')',
            ',': ',',
        };
        const op = OPS[ch];
        if (op) {
            tokens.push({ kind: op, raw: ch });
            i++;
            continue;
        }

        throw new EvalError(`Unexpected character: "${ch}" at position ${i}`);
    }

    tokens.push({ kind: 'eof', raw: '' });
    return tokens;
}

// ─── Constants & Functions ────────────────────────────────────────────────────

const CONSTANTS: Record<string, number> = {
    pi: Math.PI,
    π: Math.PI,
    e: Math.E,
    phi: (1 + Math.sqrt(5)) / 2,
    φ: (1 + Math.sqrt(5)) / 2,
    tau: 2 * Math.PI,
    τ: 2 * Math.PI,
    inf: Infinity,
    infinity: Infinity,
};

const FUNCTION_NAMES = new Set([
    'sqrt',
    'cbrt',
    'nrt',
    'abs',
    'floor',
    'ceil',
    'round',
    'trunc',
    'sign',
    'log',
    'log2',
    'log10',
    'ln',
    'exp',
    'sin',
    'cos',
    'tan',
    'asin',
    'acos',
    'atan',
    'atan2',
    'sinh',
    'cosh',
    'tanh',
    'asinh',
    'acosh',
    'atanh',
    'max',
    'min',
    'hypot',
    'pow',
    'mod',
    'gcd',
    'lcm',
    'clamp',
    'lerp',
    'deg2rad',
    'rad2deg',
    'rand',
    'randint',
]);

function toRad(x: number, unit: AngleUnit): number {
    if (unit === 'rad') return x;
    if (unit === 'grad') return (x * Math.PI) / 200;
    return (x * Math.PI) / 180; // deg
}

function fromRad(x: number, unit: AngleUnit): number {
    if (unit === 'rad') return x;
    if (unit === 'grad') return (x * 200) / Math.PI;
    return (x * 180) / Math.PI;
}

function factN(n: number): number {
    if (n < 0 || !Number.isInteger(n))
        throw new EvalError('Factorial requires a non-negative integer');
    if (n > 170) throw new EvalError('Factorial overflow (max 170!)');
    let r = 1;
    for (let k = 2; k <= n; k++) r *= k;
    return r;
}

function gcd(a: number, b: number): number {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function applyFn(name: string, args: number[], unit: AngleUnit): number {
    const n = name.toLowerCase();
    const a = args[0] ?? 0;
    const b = args[1] ?? 0;
    switch (n) {
        case 'sqrt':
            if (a < 0) throw new EvalError('sqrt of negative');
            return Math.sqrt(a);
        case 'cbrt':
            return Math.cbrt(a);
        case 'nrt':
            return Math.sign(b) * Math.pow(Math.abs(b), 1 / a); // nrt(n, x)
        case 'abs':
            return Math.abs(a);
        case 'floor':
            return Math.floor(a);
        case 'ceil':
            return Math.ceil(a);
        case 'round':
            return Math.round(a);
        case 'trunc':
            return Math.trunc(a);
        case 'sign':
            return Math.sign(a);
        case 'log': {
            if (args.length === 2) {
                if (b <= 0 || b === 1) throw new EvalError('Invalid log base');
                return Math.log(b) / Math.log(a);
            }
            if (a <= 0) throw new EvalError('log of non-positive');
            return Math.log10(a);
        }
        case 'log2':
            if (a <= 0) throw new EvalError('log2 of non-positive');
            return Math.log2(a);
        case 'log10':
            if (a <= 0) throw new EvalError('log10 of non-positive');
            return Math.log10(a);
        case 'ln':
            if (a <= 0) throw new EvalError('ln of non-positive');
            return Math.log(a);
        case 'exp':
            return Math.exp(a);
        case 'sin':
            return Math.sin(toRad(a, unit));
        case 'cos':
            return Math.cos(toRad(a, unit));
        case 'tan': {
            const r = toRad(a, unit);
            const cosV = Math.cos(r);
            if (Math.abs(cosV) < 1e-15) throw new EvalError('tan undefined');
            return Math.sin(r) / cosV;
        }
        case 'asin':
            if (a < -1 || a > 1) throw new EvalError('asin domain error');
            return fromRad(Math.asin(a), unit);
        case 'acos':
            if (a < -1 || a > 1) throw new EvalError('acos domain error');
            return fromRad(Math.acos(a), unit);
        case 'atan':
            return fromRad(Math.atan(a), unit);
        case 'atan2':
            return fromRad(Math.atan2(a, b), unit);
        case 'sinh':
            return Math.sinh(a);
        case 'cosh':
            return Math.cosh(a);
        case 'tanh':
            return Math.tanh(a);
        case 'asinh':
            return Math.asinh(a);
        case 'acosh':
            if (a < 1) throw new EvalError('acosh domain error');
            return Math.acosh(a);
        case 'atanh':
            if (a <= -1 || a >= 1) throw new EvalError('atanh domain error');
            return Math.atanh(a);
        case 'max':
            return Math.max(...args);
        case 'min':
            return Math.min(...args);
        case 'hypot':
            return Math.hypot(a, b);
        case 'pow':
            return Math.pow(a, b);
        case 'mod':
            if (b === 0) throw new EvalError('mod by zero');
            return a % b;
        case 'gcd':
            return gcd(a, b);
        case 'lcm': {
            const g = gcd(a, b);
            return g === 0 ? 0 : Math.abs(a * b) / g;
        }
        case 'clamp':
            return Math.min(Math.max(a, b), args[2] ?? b);
        case 'lerp':
            return a + (b - a) * (args[2] ?? 0);
        case 'deg2rad':
            return (a * Math.PI) / 180;
        case 'rad2deg':
            return (a * 180) / Math.PI;
        case 'rand':
            return Math.random();
        case 'randint':
            return Math.floor(Math.random() * (b - a + 1)) + a;
        default:
            throw new EvalError(`Unknown function: ${name}`);
    }
}

// ─── Parser ────────────────────────────────────────────────────────────────────

class Parser {
    private tokens: Token[];
    private pos = 0;
    private unit: AngleUnit;

    constructor(tokens: Token[], unit: AngleUnit) {
        this.tokens = tokens;
        this.unit = unit;
    }

    private peek(): Token {
        return this.tokens[this.pos] ?? { kind: 'eof', raw: '' };
    }
    private advance(): Token {
        return this.tokens[this.pos++] ?? { kind: 'eof', raw: '' };
    }
    private expect(kind: TK): Token {
        const t = this.advance();
        if (t.kind !== kind)
            throw new EvalError(`Expected "${kind}", got "${t.raw || t.kind}"`);
        return t;
    }

    parse(): number {
        const val = this.expr();
        if (this.peek().kind !== 'eof') {
            throw new EvalError(`Unexpected token: "${this.peek().raw}"`);
        }
        return val;
    }

    private expr(): number {
        return this.additive();
    }

    private additive(): number {
        let left = this.multiplicative();
        while (this.peek().kind === '+' || this.peek().kind === '-') {
            const op = this.advance().kind;
            const right = this.multiplicative();
            left = op === '+' ? left + right : left - right;
        }
        return left;
    }

    private multiplicative(): number {
        let left = this.power();
        for (;;) {
            const k = this.peek().kind;
            if (k === '*' || k === '/') {
                const op = this.advance().kind;
                const right = this.power();
                if (op === '/') {
                    if (right === 0) throw new EvalError('Division by zero');
                    left = left / right;
                } else {
                    left = left * right;
                }
            } else if (k === '(' || k === 'id') {
                // Implicit multiplication: 2(3+4), 2pi, 2sin(x)
                left = left * this.power();
            } else {
                break;
            }
        }
        return left;
    }

    private power(): number {
        const base = this.unary();
        if (this.peek().kind === '^') {
            this.advance();
            return Math.pow(base, this.power()); // right-associative
        }
        return base;
    }

    private unary(): number {
        if (this.peek().kind === '-') {
            this.advance();
            return -this.postfix();
        }
        if (this.peek().kind === '+') {
            this.advance();
            return this.postfix();
        }
        return this.postfix();
    }

    private postfix(): number {
        let val = this.primary();
        for (;;) {
            if (this.peek().kind === '%') {
                this.advance();
                val = val / 100;
            } else if (this.peek().kind === '!') {
                this.advance();
                val = factN(val);
            } else break;
        }
        return val;
    }

    private primary(): number {
        const t = this.peek();

        // Number literal
        if (t.kind === 'num') {
            this.advance();
            return t.num!;
        }

        // Parenthesised expression
        if (t.kind === '(') {
            this.advance();
            const val = this.expr();
            this.expect(')');
            return val;
        }

        // Identifier: constant or function
        if (t.kind === 'id') {
            this.advance();
            const name = t.raw;
            const lower = name.toLowerCase();

            // Constant
            const constVal = CONSTANTS[name] ?? CONSTANTS[lower];
            if (constVal !== undefined) {
                // Don't peek for '(' here — constants can't be called
                return constVal;
            }

            // Function call
            if (FUNCTION_NAMES.has(lower)) {
                this.expect('(');
                const args: number[] = [];
                if (this.peek().kind !== ')') {
                    args.push(this.expr());
                    while (this.peek().kind === ',') {
                        this.advance();
                        args.push(this.expr());
                    }
                }
                this.expect(')');
                return applyFn(lower, args, this.unit);
            }

            throw new EvalError(`Unknown identifier: "${name}"`);
        }

        if (t.kind === 'eof')
            throw new EvalError('Unexpected end of expression');
        throw new EvalError(`Unexpected token: "${t.raw}"`);
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class EvalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvalError';
    }
}

/** Evaluate a math expression string. Throws EvalError on invalid input. */
export function evaluate(expression: string, unit: AngleUnit = 'deg'): number {
    if (!expression.trim()) throw new EvalError('Empty expression');
    const tokens = lex(expression);
    const parser = new Parser(tokens, unit);
    const result = parser.parse();
    if (!isFinite(result)) {
        if (isNaN(result)) throw new EvalError('Result is not a number');
        throw new EvalError(
            'Result is infinity — check for division by zero or overflow',
        );
    }
    return result;
}

/** Format a numeric result with given decimal precision (trailing zeros stripped). */
export function formatResult(value: number, precision = 10): string {
    if (!isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    if (isNaN(value)) return 'NaN';

    // Use toPrecision to handle very large/small numbers sensibly
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e15 || abs < 1e-7)) {
        // Scientific notation
        return value.toPrecision(precision).replace(/\.?0+(e)/, '$1');
    }

    const fixed = value.toFixed(precision);
    // Strip trailing zeros after decimal
    return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
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
    // If it ends with a multi-char function name like "sqrt("
    const fnMatch = expression.match(/([a-zA-Z]+\()$/);
    if (fnMatch) return expression.slice(0, -fnMatch[1].length);
    return expression.slice(0, -1);
}

/** Get step-by-step breakdown tokens for display. */
export function tokenizeForDisplay(expression: string): string[] {
    try {
        const tokens = lex(expression);
        return tokens.filter((t) => t.kind !== 'eof').map((t) => t.raw);
    } catch {
        return [expression];
    }
}
