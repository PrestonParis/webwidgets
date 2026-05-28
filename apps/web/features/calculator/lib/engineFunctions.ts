import type { AngleUnit } from '../types/calculator';

export const CONSTANTS: Record<string, number> = {
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

export const FUNCTION_NAMES = new Set([
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

export function toRad(x: number, unit: AngleUnit): number {
    if (unit === 'rad') return x;
    if (unit === 'grad') return (x * Math.PI) / 200;
    return (x * Math.PI) / 180;
}

export function fromRad(x: number, unit: AngleUnit): number {
    if (unit === 'rad') return x;
    if (unit === 'grad') return (x * 200) / Math.PI;
    return (x * 180) / Math.PI;
}

export function factN(n: number): number {
    if (n < 0 || !Number.isInteger(n))
        throw new Error('Factorial requires a non-negative integer');
    if (n > 170) throw new Error('Factorial overflow (max 170!)');
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

export function applyFn(name: string, args: number[], unit: AngleUnit): number {
    const n = name.toLowerCase();
    const a = args[0] ?? 0;
    const b = args[1] ?? 0;
    switch (n) {
        case 'sqrt':
            if (a < 0) throw new Error('sqrt of negative');
            return Math.sqrt(a);
        case 'cbrt':
            return Math.cbrt(a);
        case 'nrt':
            return Math.sign(b) * Math.pow(Math.abs(b), 1 / a);
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
                if (b <= 0 || b === 1) throw new Error('Invalid log base');
                return Math.log(b) / Math.log(a);
            }
            if (a <= 0) throw new Error('log of non-positive');
            return Math.log10(a);
        }
        case 'log2':
            if (a <= 0) throw new Error('log2 of non-positive');
            return Math.log2(a);
        case 'log10':
            if (a <= 0) throw new Error('log10 of non-positive');
            return Math.log10(a);
        case 'ln':
            if (a <= 0) throw new Error('ln of non-positive');
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
            if (Math.abs(cosV) < 1e-15) throw new Error('tan undefined');
            return Math.sin(r) / cosV;
        }
        case 'asin':
            if (a < -1 || a > 1) throw new Error('asin domain error');
            return fromRad(Math.asin(a), unit);
        case 'acos':
            if (a < -1 || a > 1) throw new Error('acos domain error');
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
            if (a < 1) throw new Error('acosh domain error');
            return Math.acosh(a);
        case 'atanh':
            if (a <= -1 || a >= 1) throw new Error('atanh domain error');
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
            if (b === 0) throw new Error('mod by zero');
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
            throw new Error(`Unknown function: ${name}`);
    }
}
