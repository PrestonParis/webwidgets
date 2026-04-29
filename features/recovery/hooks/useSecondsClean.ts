import { useState, useEffect } from 'react';

export function useSecondsClean(startTime: string | null) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        const start = new Date(startTime).getTime();

        const interval = setInterval(() => {
            setSeconds(Math.floor((Date.now() - start) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return seconds;
}
