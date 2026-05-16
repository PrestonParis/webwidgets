export function LogoNegativeSpace({ size = 130 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size * (110 / 130)}
            viewBox="0 0 130 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <mask id="ns-mask">
                    <rect width="130" height="110" fill="white" />
                    {/* Inner W cutout — stays in original position */}
                    <path
                        d="M36 34 L44 68 L52 50 L60 64 L68 50 L76 68 L84 34"
                        stroke="black"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                    {/* Cursor cutout */}
                    <polygon
                        points="78,70 86,80 80,78 78,86 74,72"
                        fill="black"
                    />
                </mask>
                <linearGradient id="ns-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffd93d" />
                    <stop offset="60%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                <style>{`
                    .ns-outer {
                        animation: ns-pulse 3s ease-in-out infinite;
                    }
                    @keyframes ns-pulse {
                        0%, 100% { filter: drop-shadow(0 0 6px #ffd93d55); }
                        50%       { filter: drop-shadow(0 0 18px #ffd93daa); }
                    }
                `}</style>
            </defs>
            <g className="ns-outer">
                {/* Outer W — thickened and lowered 8px */}
                <path
                    d="M20 30 L32 86 L45 54 L60 76 L75 54 L88 86 L100 30"
                    stroke="url(#ns-grad)"
                    strokeWidth="30"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    mask="url(#ns-mask)"
                />
                {/* Rim highlight */}
                <path
                    d="M20 30 L32 86 L45 54 L60 76 L75 54 L88 86 L100 30"
                    stroke="#fff"
                    strokeWidth="0.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.15"
                />
            </g>
        </svg>
    );
}
