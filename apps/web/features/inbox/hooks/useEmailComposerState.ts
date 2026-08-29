import { useCallback, useEffect, useState } from 'react';
import type {
    EmailActionRequest,
    EmailWorkspace,
} from '@/lib/emailActions/receipts';
import { loadEmailWorkspace } from '../api/emailActions';

export const emptyEmailForm = {
    accountId: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
};
const newKeys = () => ({
    'email.draft': crypto.randomUUID(),
    'email.send': crypto.randomUUID(),
});

export function useEmailComposerState() {
    const [workspace, setWorkspace] = useState<EmailWorkspace | null>(null);
    const [form, setForm] = useState(emptyEmailForm);
    const [review, setReview] = useState<EmailActionRequest | null>(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [keys, setKeys] = useState(newKeys);
    const applyWorkspace = useCallback((data: EmailWorkspace) => {
        setWorkspace(data);
        setReview((old) =>
            old
                ? (data.requests.find((request) => request.id === old.id) ??
                  old)
                : null,
        );
        setForm((old) =>
            old.accountId
                ? old
                : {
                      ...old,
                      accountId:
                          data.accounts.find(
                              (account) => account.provider === 'google',
                          )?.id ?? '',
                  },
        );
    }, []);
    async function refresh() {
        applyWorkspace(await loadEmailWorkspace());
    }
    useEffect(() => {
        let active = true;
        void loadEmailWorkspace()
            .then((data) => {
                if (active) applyWorkspace(data);
            })
            .catch(() => {
                if (active)
                    setNotice(
                        'Email actions are not available yet. Please try again after deployment.',
                    );
            });
        return () => {
            active = false;
        };
    }, [applyWorkspace]);
    async function perform(operation: () => Promise<void>) {
        setBusy(true);
        setNotice('');
        try {
            await operation();
            await refresh();
        } catch (error) {
            setNotice(
                error instanceof Error ? error.message : 'Email action failed.',
            );
        } finally {
            setBusy(false);
        }
    }
    function resetReview() {
        setReview(null);
        setKeys(newKeys());
        setNotice('');
    }
    function edit(field: keyof typeof emptyEmailForm, value: string) {
        setForm({ ...form, [field]: value });
        resetReview();
    }
    return {
        workspace,
        form,
        review,
        busy,
        notice,
        keys,
        setReview,
        setNotice,
        perform,
        edit,
        resetReview,
        refresh: () => perform(() => Promise.resolve()),
        newMessage: () => {
            setForm({ ...emptyEmailForm, accountId: form.accountId });
            resetReview();
        },
    };
}
