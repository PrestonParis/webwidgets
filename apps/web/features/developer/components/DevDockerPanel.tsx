'use client';

import {
    StatusBadge,
    Panel,
    Unavailable,
    type DeveloperWorkspaceSnapshot,
} from './DevShared';

export function DevDockerPanel({ data }: { data: DeveloperWorkspaceSnapshot }) {
    return (
        <Panel title="Read-only Docker Visibility">
            {data.containers.length === 0 ? (
                <Unavailable>
                    Docker socket is unavailable or no containers are visible to
                    this process.
                </Unavailable>
            ) : (
                <div className="space-y-2">
                    {data.containers.map((container) => (
                        <div
                            key={container.id}
                            className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">
                                    {container.name}
                                </span>
                                <StatusBadge status={container.status} />
                            </div>
                            <p className="mt-1 text-zinc-500">
                                {container.image}
                            </p>
                            <p className="mt-1 text-zinc-500">
                                {container.ports.join(', ') ||
                                    'No published ports'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
