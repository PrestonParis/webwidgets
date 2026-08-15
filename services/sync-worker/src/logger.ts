export type LogLevel = 'info' | 'warn' | 'error';

export interface LogFields {
    [key: string]: boolean | number | string | null | undefined;
}

export interface RuntimeLogger {
    info(message: string, fields?: LogFields): void;
    warn(message: string, fields?: LogFields): void;
    error(message: string, fields?: LogFields): void;
}

function write(level: LogLevel, message: string, fields: LogFields = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...fields,
    };
    const output = JSON.stringify(entry);
    if (level === 'error') console.error(output);
    else if (level === 'warn') console.warn(output);
    else console.log(output);
}

export const logger: RuntimeLogger = {
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
};
