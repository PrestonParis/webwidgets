import {
    emailMessageSchema,
    hasEmailActionScope,
    type EmailActionId,
} from '@/lib/emailActions/contracts';
import { decideEmail, proposeEmail, reconcileEmail } from '../api/emailActions';
import { useEmailComposerState } from './useEmailComposerState';

const split = (value: string) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export function useEmailComposer() {
    const state = useEmailComposerState();
    const { workspace, form, review, perform, setReview, setNotice } = state;
    const account = workspace?.accounts.find(
        (item) => item.id === form.accountId,
    );
    async function prepare(actionId: EmailActionId) {
        await perform(async () => {
            if (!account) throw new Error('Select an email account.');
            const parsed = emailMessageSchema.safeParse({
                ...form,
                provider: account.provider,
                from: account.email,
                to: split(form.to),
                cc: split(form.cc),
                bcc: split(form.bcc),
                reply: null,
            });
            if (!parsed.success)
                throw new Error(
                    'Check recipient addresses, subject and body. Use commas between addresses; maximum 20 recipients.',
                );
            setReview(
                await proposeEmail(actionId, parsed.data, state.keys[actionId]),
            );
        });
    }
    async function approve() {
        if (!review) return;
        await perform(async () => {
            const result = await decideEmail(review, 'approved');
            setNotice(
                result.queued
                    ? 'Approved and queued. Refresh status to see the verified result.'
                    : 'Approval saved; queue delivery is unconfirmed. Retry this same approval—do not compose another copy.',
            );
            setReview(result.request);
        });
    }
    async function abandon() {
        if (!review || review.approval_state !== 'required') return;
        await perform(async () => {
            await decideEmail(review, 'denied');
            state.resetReview();
        });
    }
    const can = (actionId: EmailActionId) =>
        Boolean(
            workspace?.enabled &&
            account &&
            hasEmailActionScope(
                account.provider,
                actionId,
                account.granted_scopes,
            ),
        );
    return {
        ...state,
        prepare,
        approve,
        abandon,
        can,
        reconcile: (id: string) =>
            perform(async () => {
                await reconcileEmail(id);
                setNotice(
                    'Read-only reconciliation queued. No message will be resent.',
                );
            }),
    };
}
