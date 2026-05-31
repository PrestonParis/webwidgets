'use client';

import { useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import type {
    ContextEdge,
    ContextGraph,
    ContextNode,
    UpsertEntryPayload,
} from '@/features/context/types/context';
import { createEdge, deleteEdge } from '@/features/context/api/contextApi';

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
    const connectedEdges = graph.edges.filter(
        (edge) => edge.from === node.entityId || edge.to === node.entityId,
    );
    const explicitEdges = connectedEdges.filter(
        (edge) => (edge.kind ?? 'explicit') === 'explicit',
    );
    const generatedEdges = connectedEdges.filter(
        (edge) => (edge.kind ?? 'explicit') !== 'explicit',
    );
    const availableNodes = [
        ...new Map(
            graph.nodes
                .filter(
                    (item) =>
                        item.entityId !== node.entityId &&
                        !explicitEdges.some(
                            (edge) =>
                                (edge.from === node.entityId &&
                                    edge.to === item.entityId) ||
                                (edge.to === node.entityId &&
                                    edge.from === item.entityId),
                        ),
                )
                .map((item) => [item.entityId, item]),
        ).values(),
    ];

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
            await createEdge({
                fromEntityId: node.entityId,
                toEntityId: targetId,
                kind: 'explicit',
                label: 'linked',
                metadata: { feature: 'context-relationship-editor' },
            });
            setTargetId('');
            onSelectNode(node.entityId);
        } finally {
            setSaving(false);
        }
    }

    async function removeRelationship(edge: ContextEdge) {
        if (!edge.id) return;
        setSaving(true);
        try {
            await deleteEdge(edge.id);
            if (edge.from === node.entityId) {
                await onUpsert({
                    entityId: node.entityId,
                    entryType: node.entryType,
                    label: node.label,
                    data: node.data,
                    linkedTo: node.linkedTo.filter((item) => item !== edge.to),
                });
            }
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
                {explicitEdges.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {explicitEdges.map((edge) => {
                            const otherId =
                                edge.from === node.entityId
                                    ? edge.to
                                    : edge.from;
                            return (
                                <div
                                    key={edge.id ?? `${edge.from}-${edge.to}`}
                                    className="flex items-center justify-between rounded-md bg-zinc-50 px-2 py-1.5 text-xs dark:bg-zinc-900"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-zinc-600 dark:text-zinc-300">
                                            {graph.nodes.find(
                                                (item) =>
                                                    item.entityId === otherId,
                                            )?.label ?? otherId}
                                        </p>
                                        <p className="truncate text-[10px] text-zinc-400">
                                            {edge.label ?? 'explicit link'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={saving || !edge.id}
                                        onClick={() =>
                                            void removeRelationship(edge)
                                        }
                                        className="text-zinc-400 hover:text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
                {generatedEdges.length > 0 && (
                    <div className="mt-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            Generated Relationships
                        </p>
                        {generatedEdges.slice(0, 8).map((edge) => {
                            const otherId =
                                edge.from === node.entityId
                                    ? edge.to
                                    : edge.from;
                            return (
                                <div
                                    key={
                                        edge.id ??
                                        `${edge.from}-${edge.to}-${edge.kind}`
                                    }
                                    className="rounded-md bg-zinc-50 px-2 py-1.5 text-xs dark:bg-zinc-900"
                                >
                                    <p className="truncate text-zinc-600 dark:text-zinc-300">
                                        {graph.nodes.find(
                                            (item) => item.entityId === otherId,
                                        )?.label ?? otherId}
                                    </p>
                                    <p className="truncate text-[10px] text-zinc-400">
                                        {edge.kind} · confidence{' '}
                                        {edge.confidence ?? 1}
                                    </p>
                                </div>
                            );
                        })}
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
