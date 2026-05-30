export function isMissingTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybe = error as { code?: string; message?: string };
    const message = maybe.message?.toLowerCase() ?? '';
    return (
        maybe.code === '42P01' ||
        maybe.code === 'PGRST205' ||
        (message.includes('relation') && message.includes('does not exist')) ||
        message.includes('could not find the table')
    );
}
