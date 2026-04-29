import { useCallback, useRef } from 'react';

// A debounce hook that returns a debounced version of the provided function.
export function useDebounce<T extends unknown[]>(
    fn: (...args: T) => void,
    delay: number,
): (...args: T) => void {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        (...args: T) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => fn(...args), delay);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [delay],
    );
}
