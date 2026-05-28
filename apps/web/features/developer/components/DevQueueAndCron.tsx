'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    StatusBadge,
    Panel,
    Unavailable,
    type DeveloperWorkspaceSnapshot,
} from './DevShared';

export function DevQueueAndCron({
    data,
    mode,
}: {
    data: DeveloperWorkspaceSnapshot;
    mode: 'cron' | 'queues';
}) {
    if (mode === 'cron') {
        return (
            <Panel title="Cron + Job Registry">
                <div className="space-y-2">
                    {data.cronJobs.map((job) => (
                        <div
                            key={job.id}
                            className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-medium">{job.id}</span>
                                <StatusBadge status={job.status} />
                            </div>
                            <p className="mt-1 text-zinc-500">
                                {job.source}
                                {job.schedule ? ` - ${job.schedule}` : ''}
                            </p>
                            {job.detail && (
                                <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                                    {job.detail}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    return (
        <Panel title="Queue + Worker Visibility">
            <div className="grid gap-3 md:grid-cols-2">
                {data.queues.map((queue) => (
                    <div
                        key={queue.name}
                        className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                        <div className="flex items-center justify-between">
                            <p className="font-medium">{queue.name}</p>
                            <StatusBadge status={queue.status} />
                        </div>
                        {queue.counts ? (
                            <div className="mt-3 h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={Object.entries(queue.counts).map(
                                            ([name, value]) => ({
                                                name,
                                                value,
                                            }),
                                        )}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" fontSize={11} />
                                        <YAxis
                                            allowDecimals={false}
                                            fontSize={11}
                                        />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#2563eb" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <Unavailable>
                                {queue.detail ?? 'Queue adapter unavailable.'}
                            </Unavailable>
                        )}
                    </div>
                ))}
            </div>
        </Panel>
    );
}
