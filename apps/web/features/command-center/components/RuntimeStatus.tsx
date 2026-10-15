import type { CommandCenterController } from '../hooks/useCommandCenter';

function timeLabel(value: string | null | undefined) {
    if (!value) return 'No recent worker heartbeat';
    return `Last worker heartbeat ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))}`;
}

export function RuntimeStatus({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const degraded =
        controller.runtime.isError ||
        controller.runtime.data?.state === 'degraded';
    if (controller.runtime.isLoading) {
        return (
            <p className="mt-6 text-xs text-zinc-500" role="status">
                Checking background services…
            </p>
        );
    }
    if (!degraded) return null;
    return (
        <div
            className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            role="alert"
        >
            <p className="text-sm font-semibold">
                Background processing is temporarily degraded
            </p>
            <p className="mt-1 text-xs leading-5">
                New source updates, briefings, and approved actions may be
                delayed. Existing timeline data and tasks remain available;
                WebWidgets will not report delayed work as completed.
            </p>
            <p className="mt-2 text-[11px] opacity-80">
                {timeLabel(controller.runtime.data?.lastSeenAt)}
            </p>
        </div>
    );
}
