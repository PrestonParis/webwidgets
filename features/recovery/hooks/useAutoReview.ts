import { useEffect, useRef } from 'react';

let autoReviewTriggered = false;

export function useAutoReview(open: () => Promise<void>, needsReview: boolean) {
    const openRef = useRef(open);
    const needsReviewRef = useRef(needsReview);
    const autoOpenedRef = useRef(false);

    useEffect(() => {
        if (
            autoReviewTriggered ||
            autoOpenedRef.current ||
            !needsReviewRef.current
        )
            return;
        autoReviewTriggered = true;
        autoOpenedRef.current = true;
        void openRef.current();
    }, []);
}
