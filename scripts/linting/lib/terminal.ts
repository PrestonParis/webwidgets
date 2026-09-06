const useColor =
    !process.env.NO_COLOR &&
    (process.stdout.isTTY === true || process.env.FORCE_COLOR === '1');

const wrap = (code: number, value: string): string =>
    useColor ? `\u001B[${code}m${value}\u001B[0m` : value;

export const color = {
    cyan: (value: string) => wrap(36, value),
    dim: (value: string) => wrap(2, value),
    green: (value: string) => wrap(32, value),
    red: (value: string) => wrap(31, value),
    yellow: (value: string) => wrap(33, value),
};

export function formatDuration(durationMs: number): string {
    if (durationMs < 1_000) return `${Math.round(durationMs)}ms`;
    return `${(durationMs / 1_000).toFixed(1)}s`;
}

export function phaseStart(name: string, detail?: string): void {
    const suffix = detail ? ` ${color.dim(detail)}` : '';
    console.log(`\n${color.cyan('▶')} ${color.cyan(name)}${suffix}`);
}

export function progress(message: string): void {
    console.log(`  ${color.cyan('…')} ${message}`);
}

export function phaseResult(
    name: string,
    status: 'pass' | 'fail' | 'warn',
    summary: string,
    durationMs: number,
): void {
    const presentation = {
        pass: { icon: '✓', paint: color.green },
        fail: { icon: '✗', paint: color.red },
        warn: { icon: '!', paint: color.yellow },
    }[status];
    console.log(
        `${presentation.paint(presentation.icon)} ${presentation.paint(name)} ${summary} ${color.dim(`(${formatDuration(durationMs)})`)}`,
    );
}
