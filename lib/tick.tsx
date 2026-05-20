'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

const TickContext = createContext(0);

export function TickProvider({ children }: { children: ReactNode }) {
    const [tick, setTick] = useState(() => Date.now());

    useEffect(() => {
        let id: ReturnType<typeof setInterval>;

        function start() {
            id = setInterval(() => setTick(Date.now()), 1000);
        }

        function pause() {
            clearInterval(id);
        }

        function handleVisibility() {
            if (document.hidden) {
                pause();
            } else {
                setTick(Date.now()); // catch up immediately on tab focus
                start();
            }
        }

        start();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            pause();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return <TickContext.Provider value={tick}>{children}</TickContext.Provider>;
}

/** Returns the current timestamp (ms), updated every second. Pauses when the
 *  tab is hidden to avoid unnecessary re-renders in background tabs. */
export function useTick(): number {
    return useContext(TickContext);
}
