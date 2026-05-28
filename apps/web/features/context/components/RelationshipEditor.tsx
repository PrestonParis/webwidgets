'use client';

import { useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import type {
    ContextGraph,
    ContextNode,
    UpsertEntryPayload,
} from '@/features/context/types/context';

interface RelationshipEditorProps {
    node: ContextNode;
    graph: ContextGraph;
    onUpsert: (payload: UpsertEntryPayload) => Promise<void>;
    onSelectNode: (entityId: string) => void;
}

export function RelationshipEditor({
    node,
    graph,
    onUpsert,
    onSelectNode,
}: RelationshipEditorProps) {
    const [targetId, setTargetId] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const availableNodes = graph.nodes.filter(
        (item) =>
            item.entityId !== node.entityId &&
            !node.linkedTo.includes(item.entityId),
    );

    async function addRelationship() {
        if (!targetId) return;
        setSaving(true);
        try {
            await onUpsert({
                entityId: node.entityId,
                entryType: node.entryType,
                label: node.label,
                data: node.data,
                linkedTo: [...node.linkedTo, targetId],
            });
            setTargetId('');
            onSelectNode(node.entityId);
        } finally {
            setSaving(false);
        }
    }

    async function removeRelationship(id: string) {
        setSaving(true);
        try {
            await onUpsert({
                entityId: node.entityId,
                entryType: node.entryType,
                label: node.label,
                data: node.data,
                linkedTo: node.linkedTo.filter((item) => item !== id),
            });
        } finally {
            setSaving(false);
        }
    }

    async function addNote() {
        if (!note.trim()) return;
        setSaving(true);
        try {
            await onUpsert({
                entityId: `insight-${node.entityId}-${Date.now()}`,
                entryType: 'insight',
                label: `Note for ${node.label}`,
                data: { note: note.trim(), source: 'context-inspector' },
                linkedTo: [node.entityId],
            });
            setNote('');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Edit Relationships
                </h3>
                <div className="flex gap-2">
                    <select
                        value={targetId}
                        onChange={(event) => setTargetId(event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                        <option value="">Choose node</option>
                        {availableNodes.map((item) => (
                            <option key={item.entityId} value={item.entityId}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => void addRelationship()}
                        disabled={!targetId || saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    >
                        <Link2 size={13} />
                        Link
                    </button>
                </div>
                {node.linkedTo.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {node.linkedTo.map((id) => (
                            <div
                                key={id}
                                className="flex items-center justify-between rounded-md bg-zinc-50 px-2 py-1.5 text-xs dark:bg-zinc-900"
                            >
                                <span className="truncate text-zinc-600 dark:text-zinc-300">
                                    {graph.nodes.find(
                                        (item) => item.entityId === id,
                                    )?.label ?? id}
                                </span>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => void removeRelationship(id)}
                                    className="text-zinc-400 hover:text-rose-600"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Add Note
                </h3>
                <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    placeholder="Attach context, workflow notes, or memory references"
                    className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <button
                    type="button"
                    onClick={() => void addNote()}
                    disabled={!note.trim() || saving}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"
                >
                    <Plus size={13} />
                    Attach Note
                </button>
            </section>
        </div>
    );
}
