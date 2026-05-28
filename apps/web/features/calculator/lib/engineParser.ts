import type { AngleUnit } from '../types/calculator';
import { type Token, type TK } from './engineTokenizer';
import { CONSTANTS, FUNCTION_NAMES, factN, applyFn } from './engineFunctions';

export class Parser {
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
            throw new Error(`Expected "${kind}", got "${t.raw || t.kind}"`);
        return t;
    }

    parse(): number {
        const val = this.expr();
        if (this.peek().kind !== 'eof')
            throw new Error(`Unexpected token: "${this.peek().raw}"`);
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
                    if (right === 0) throw new Error('Division by zero');
                    left = left / right;
                } else {
                    left = left * right;
                }
            } else if (k === '(' || k === 'id') {
                left = left * this.power(); // implicit multiplication: 2(3+4), 2pi
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
            return Math.pow(base, this.power());
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
        if (t.kind === 'num') {
            this.advance();
            return t.num!;
        }
        if (t.kind === '(') {
            this.advance();
            const val = this.expr();
            this.expect(')');
            return val;
        }
        if (t.kind === 'id') {
            this.advance();
            const name = t.raw;
            const lower = name.toLowerCase();
            const constVal = CONSTANTS[name] ?? CONSTANTS[lower];
            if (constVal !== undefined) return constVal;
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
            throw new Error(`Unknown identifier: "${name}"`);
        }
        if (t.kind === 'eof') throw new Error('Unexpected end of expression');
        throw new Error(`Unexpected token: "${t.raw}"`);
    }
}
