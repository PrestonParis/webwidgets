import { useEffect, useRef, useState } from 'react';
import { fetchEmailBody } from '@/features/inbox/lib/inboxApiService';
import type { EmailAction } from '@/features/inbox/types/inbox';

export function useEmailCard(
    emailActions: EmailAction[],
    extracting?: boolean,
) {
    const [open, setOpen] = useState(false);
    const [bodyOpen, setBodyOpen] = useState(false);
    const [body, setBody] = useState<string | null>(null);
    const [bodyLoading, setBodyLoading] = useState(false);
    const [showActions, setShowActions] = useState(emailActions.length > 0);
    const prevExtracting = useRef(false);

    useEffect(() => {
        if (prevExtracting.current && !extracting && emailActions.length > 0)
            setShowActions(true);
        prevExtracting.current = extracting ?? false;
    }, [extracting, emailActions.length]);

    useEffect(() => {
        if (emailActions.length > 0) queueMicrotask(() => setShowActions(true));
    }, [emailActions.length]);

    async function handleReadEmail(mailId: string) {
        if (bodyOpen) {
            setBodyOpen(false);
            return;
        }
        setBodyOpen(true);
        if (body !== null) return;
        setBodyLoading(true);
        setBody(await fetchEmailBody(mailId));
        setBodyLoading(false);
    }

    return {
        open,
        setOpen,
        bodyOpen,
        body,
        bodyLoading,
        showActions,
        setShowActions,
        handleReadEmail,
    };
}
