'use client';

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
    level: Level;
    message: string;
    [key: string]: unknown;
}

function emit(entry: LogEntry): void {
    const { level, message, ...rest } = entry;
    const hasCtx = Object.keys(rest).length > 0;
    const fn =
        level === 'error' || level === 'fatal'
            ? console.error
            : level === 'warn'
              ? console.warn
              : level === 'trace' || level === 'debug'
                ? console.debug
                : console.info;
    if (hasCtx) {
        fn(`[${level.toUpperCase()}] ${message}`, rest);
    } else {
        fn(`[${level.toUpperCase()}] ${message}`);
    }
}

export const clientLogger = {
    trace: (msg: string, ctx?: object) =>
        emit({ level: 'trace', message: msg, ...ctx }),
    debug: (msg: string, ctx?: object) =>
        emit({ level: 'debug', message: msg, ...ctx }),
    info: (msg: string, ctx?: object) =>
        emit({ level: 'info', message: msg, ...ctx }),
    warn: (msg: string, ctx?: object) =>
        emit({ level: 'warn', message: msg, ...ctx }),
    error: (msg: string, ctx?: object) =>
        emit({ level: 'error', message: msg, ...ctx }),
    fatal: (msg: string, ctx?: object) =>
        emit({ level: 'fatal', message: msg, ...ctx }),
};
