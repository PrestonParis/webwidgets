import type { BodyIssueHistory } from '@/features/tracking/health/lib/bodyIssues';

export function SeveritySparkline({
    entries,
}: {
    entries: BodyIssueHistory[];
}) {
    if (entries.length < 2) return null;
    const values = entries.map((entry) => entry.severity);
    const width = 48;
    const height = 16;
    const points = values.map(
        (value, index) =>
            `${(index / (values.length - 1)) * width},${height - (value / 10) * height}`,
    );

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shrink-0"
            aria-hidden
        >
            <polyline
                points={points.join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function MiniSparkline({ entries }: { entries: BodyIssueHistory[] }) {
    if (entries.length < 2) return null;
    const width = 40;
    const height = 12;
    const points = entries.map(
        (entry, index) =>
            `${(index / (entries.length - 1)) * width},${height - (entry.severity / 10) * height}`,
    );

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden
            className="shrink-0"
        >
            <polyline
                points={points.join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}
