export type TK =
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

export interface Token {
    kind: TK;
    raw: string;
    num?: number;
}

function parseSciSuffix(
    s: string,
    start: number,
): { sci: string; end: number } | null {
    let i = start;
    let sci = s[i++]!;
    if (i < s.length && /[+\-]/.test(s[i]!)) sci += s[i++];
    if (i < s.length && /[0-9]/.test(s[i]!)) {
        while (i < s.length && /[0-9]/.test(s[i]!)) sci += s[i++];
        return { sci, end: i };
    }
    return null;
}

export function lex(src: string): Token[] {
    const tokens: Token[] = [];
    const s = src.replace(/\s+/g, ' ').trim();
    let i = 0;

    while (i < s.length) {
        const ch = s[i]!;
        if (ch === ' ') {
            i++;
            continue;
        }

        if (
            /[0-9]/.test(ch) ||
            (ch === '.' && i + 1 < s.length && /[0-9]/.test(s[i + 1]!))
        ) {
            let raw = '';
            while (i < s.length && /[0-9.]/.test(s[i]!)) raw += s[i++];
            if (i < s.length && /[eE]/.test(s[i]!)) {
                const suffix = parseSciSuffix(s, i);
                if (suffix) {
                    raw += suffix.sci;
                    i = suffix.end;
                }
            }
            const num = parseFloat(raw);
            if (isNaN(num)) throw new Error(`Invalid number: ${raw}`);
            tokens.push({ kind: 'num', raw, num });
            continue;
        }

        if (/[a-zA-Zπτφ]/.test(ch)) {
            let id = '';
            while (i < s.length && /[a-zA-Z0-9πτφ_]/.test(s[i]!)) id += s[i++];
            tokens.push({ kind: 'id', raw: id });
            continue;
        }

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

        throw new Error(`Unexpected character: "${ch}" at position ${i}`);
    }

    tokens.push({ kind: 'eof', raw: '' });
    return tokens;
}
