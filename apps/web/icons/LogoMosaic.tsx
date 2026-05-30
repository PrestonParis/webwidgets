export function LogoMosaic({ size = 120 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size * (100 / 120)}
            viewBox="0 0 120 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Left leg */}
            <polygon
                points="12,22 22,22 28,62 18,62"
                fill="#ff6b6b"
                opacity="0.9"
            />
            {/* Left inner slope */}
            <polygon
                points="28,62 38,62 46,42 36,42"
                fill="#ff8a80"
                opacity="0.7"
            />
            {/* Center peak frame */}
            <polygon
                points="36,42 60,22 84,42 60,56"
                fill="#fff"
                opacity="0.12"
                stroke="#ff6b6b"
                strokeWidth="1"
            />
            {/* Center accent diamond */}
            <polygon points="50,38 60,28 70,38 60,48" fill="#fb923c" />
            {/* Right inner slope */}
            <polygon
                points="74,42 84,42 92,62 82,62"
                fill="#ff8a80"
                opacity="0.7"
            />
            {/* Right leg */}
            <polygon
                points="92,62 102,62 108,22 98,22"
                fill="#ff6b6b"
                opacity="0.9"
            />
            {/* Left base */}
            <polygon
                points="18,62 28,62 24,78 14,78"
                fill="#ff6b6b"
                opacity="0.6"
            />
            {/* Right base */}
            <polygon
                points="92,62 102,62 106,78 96,78"
                fill="#ff6b6b"
                opacity="0.6"
            />
            {/* Grid lines */}
            <line
                x1="12"
                y1="22"
                x2="108"
                y2="22"
                stroke="#ff6b6b"
                strokeWidth="0.5"
                opacity="0.15"
            />
            <line
                x1="18"
                y1="62"
                x2="102"
                y2="62"
                stroke="#ff6b6b"
                strokeWidth="0.5"
                opacity="0.15"
            />
        </svg>
    );
}
