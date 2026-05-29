'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Background,
    Controls,
    ReactFlow,
    type Edge,
    type Node,
} from '@xyflow/react';
import {
    Panel,
    Unavailable,
    type DeveloperWorkspaceSnapshot,
} from './DevShared';

export function DevSchemaExplorer({
    data,
}: {
    data: DeveloperWorkspaceSnapshot;
}) {
    const nodes = data.schema.tables.slice(0, 60).map<Node>((table, index) => ({
        id: `${table.schema}.${table.name}`,
        data: { label: `${table.schema}.${table.name}` },
        position: { x: (index % 4) * 220, y: Math.floor(index / 4) * 90 },
    }));
    const edges = data.schema.tables.flatMap<Edge>((table) =>
        table.relationships.map((relationship, index) => ({
            id: [
                table.schema,
                table.name,
                relationship.column,
                relationship.referencesTable,
                relationship.referencesColumn,
                index,
            ].join('-'),
            source: `${table.schema}.${table.name}`,
            target: `public.${relationship.referencesTable}`,
        })),
    );
    const parentRef = useRef<HTMLDivElement | null>(null);
    const virtualizer = useVirtualizer({
        count: data.schema.tables.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 90,
    });

    return (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Panel title="Tables">
                <div ref={parentRef} className="h-[560px] overflow-auto">
                    <div
                        style={{
                            height: virtualizer.getTotalSize(),
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((item) => {
                            const table = data.schema.tables[item.index];
                            if (!table) return null;
                            return (
                                <div
                                    key={`${table.schema}.${table.name}`}
                                    className="absolute left-0 right-0 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                                    style={{
                                        transform: `translateY(${item.start}px)`,
                                    }}
                                >
                                    <p className="font-medium">
                                        {table.schema}.{table.name}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {table.columns.length} columns,{' '}
                                        {table.indexes.length} indexes,{' '}
                                        {table.policies.length} policies
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Panel>
            <Panel title="Relationship Graph">
                {nodes.length === 0 ? (
                    <Unavailable>
                        {data.schema.detail ?? 'No schema metadata available.'}
                    </Unavailable>
                ) : (
                    <div className="h-[560px] rounded border border-zinc-200 dark:border-zinc-800">
                        <ReactFlow nodes={nodes} edges={edges} fitView>
                            <Background />
                            <Controls />
                        </ReactFlow>
                    </div>
                )}
            </Panel>
        </div>
    );
}
