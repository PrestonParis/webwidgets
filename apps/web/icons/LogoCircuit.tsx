export function LogoCircuit({ size = 130 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size * (100 / 130)}
            viewBox="0 0 130 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient
                    id="circ-grad-front"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                >
                    <stop offset="0%" stopColor="#00d4aa" />
                    <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
                <style>{`
                    .circ-back {
                        stroke-dasharray: 320;
                        stroke-dashoffset: 320;
                        animation: circ-draw 1.4s ease forwards;
                    }
                    .circ-front {
                        stroke-dasharray: 320;
                        stroke-dashoffset: 320;
                        animation: circ-draw 1.4s ease forwards;
                        animation-delay: 0.35s;
                    }
                    @keyframes circ-draw { to { stroke-dashoffset: 0; } }
                `}</style>
            </defs>

            {/* Back W — same shape, offset up-left, dimmed */}
            <path
                className="circ-back"
                d="M10 25 Q14 25 17 40 L26 70 Q28 78 32 78 Q36 78 38 70 L47 45 Q50 36 53 36 Q56 36 59 45 L68 70 Q70 78 74 78 Q78 78 80 70 L89 40 Q92 25 96 25"
                stroke="#00d4aa"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.28"
                transform="translate(-5, -6)"
            />

            {/* Front W — full visibility, gradient */}
            <path
                className="circ-front"
                d="M10 25 Q14 25 17 40 L26 70 Q28 78 32 78 Q36 78 38 70 L47 45 Q50 36 53 36 Q56 36 59 45 L68 70 Q70 78 74 78 Q78 78 80 70 L89 40 Q92 25 96 25"
                stroke="url(#circ-grad-front)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />

            {/* Terminal nodes on front W */}
            <circle cx="10" cy="25" r="4" fill="#00d4aa" />
            <circle cx="96" cy="25" r="4" fill="#4ade80" />
        </svg>
    );
}
