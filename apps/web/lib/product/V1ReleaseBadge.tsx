import { getV1ReleaseState, type V1ReleaseState } from './v1FeaturePolicy';

interface V1ReleaseBadgeProps {
    state?: V1ReleaseState | 'coming-soon' | 'unavailable' | undefined;
}

export function V1ReleaseBadge({ state }: V1ReleaseBadgeProps) {
    if (state !== 'beta') return null;

    return (
        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Beta
        </span>
    );
}

export function V1WidgetReleaseBadge({ widgetType }: { widgetType: string }) {
    return <V1ReleaseBadge state={getV1ReleaseState(widgetType)} />;
}
