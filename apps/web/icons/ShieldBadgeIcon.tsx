export function ShieldBadgeIcon({
    label,
    achieved,
    isNext,
}: {
    label: string;
    achieved: boolean;
    isNext: boolean;
}) {
    const fill = achieved ? '#7c3aed' : '#18181b';
    const stroke = achieved ? '#a78bfa' : isNext ? '#6d28d9' : '#3f3f46';
    const textFill = achieved ? '#ffffff' : isNext ? '#7c3aed' : '#52525b';
    const fontSize = label.length > 4 ? 6.5 : label.length > 3 ? 7.5 : 9;

    return (
        <svg viewBox="0 0 40 46" width="40" height="46">
            <path
                d="M20 2 L36 9.5 L36 26 C36 35 20 44 20 44 C20 44 4 35 4 26 L4 9.5 Z"
                fill={fill}
                stroke={stroke}
                strokeWidth={isNext && !achieved ? 1.5 : 1}
                strokeDasharray={isNext && !achieved ? '3 2' : undefined}
            />
            {achieved && (
                <path
                    d="M20 5 L32 11"
                    fill="none"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="7"
                    strokeLinecap="round"
                />
            )}
            <text
                x="20"
                y="27"
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="bold"
                fill={textFill}
                fontFamily="system-ui,-apple-system,sans-serif"
            >
                {label}
            </text>
        </svg>
    );
}
