import { useCallback, useEffect, useState } from 'react';
import type { WorkflowActionRequest } from '@/lib/workflowActions/receipts';
import type { WorkflowWorkspace } from '@/lib/workflowActions/receipts';
import { workflowActionPayloadSchema } from '@/lib/workflowActions/contracts';
import {
    decideWorkflow,
    loadWorkflowActions,
    proposeWorkflow,
} from '../api/workflowActions';
export function useWorkflowActions() {
    const [workspace, setWorkspace] = useState<WorkflowWorkspace | null>(null);
    const [configId, setConfigId] = useState('');
    const [parameters, setParameters] = useState('{}');
    const [review, setReview] = useState<WorkflowActionRequest | null>(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [key, setKey] = useState(() => crypto.randomUUID());
    const apply = useCallback((data: WorkflowWorkspace) => {
        setWorkspace(data);
        setConfigId((old) => old || data.configs[0]?.id || '');
        setReview((old) =>
            old ? (data.requests.find((r) => r.id === old.id) ?? old) : null,
        );
    }, []);
    async function refresh() {
        apply(await loadWorkflowActions());
    }
    useEffect(() => {
        let active = true;
        void loadWorkflowActions()
            .then((data) => {
                if (active) apply(data);
            })
            .catch(() => {
                if (active)
                    setNotice('Workflow actions are not available yet.');
            });
        return () => {
            active = false;
        };
    }, [apply]);
    async function perform(operation: () => Promise<void>) {
        setBusy(true);
        setNotice('');
        try {
            await operation();
            await refresh();
        } catch (error) {
            setNotice(
                error instanceof Error
                    ? error.message
                    : 'Workflow action failed.',
            );
        } finally {
            setBusy(false);
        }
    }
    function editConfig(value: string) {
        setConfigId(value);
        setReview(null);
        setKey(crypto.randomUUID());
    }
    function editParameters(value: string) {
        setParameters(value);
        setReview(null);
        setKey(crypto.randomUUID());
    }
    async function prepare() {
        await perform(async () => {
            const config = workspace?.configs.find(
                (item) => item.id === configId,
            );
            if (!config) throw new Error('Select an enabled workflow.');
            let parsed: unknown;
            try {
                parsed = JSON.parse(parameters);
            } catch {
                throw new Error('Parameters must be valid JSON.');
            }
            const payload = workflowActionPayloadSchema.parse({
                automationConfigId: config.id,
                workflowKey: config.workflowKey,
                parameters: parsed,
            });
            setReview(await proposeWorkflow(payload, key));
        });
    }
    async function decide(decision: 'approved' | 'denied') {
        if (!review) return;
        await perform(async () => {
            const result = await decideWorkflow(review, decision);
            setReview(decision === 'approved' ? result.request : null);
            setNotice(
                result.queued ? 'Approved and queued.' : 'Decision saved.',
            );
        });
    }
    return {
        workspace,
        configId,
        parameters,
        review,
        busy,
        notice,
        editConfig,
        editParameters,
        prepare,
        approve: () => decide('approved'),
        deny: () => decide('denied'),
    };
}
