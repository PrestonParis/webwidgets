export function LogoIsometric({ size = 120 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size * (100 / 120)}
            viewBox="0 0 120 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="group"
        >
            <defs>
                <filter
                    id="iso-blur"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                >
                    <feGaussianBlur stdDeviation="2" />
                </filter>
                <style>{`
                    .iso-back  { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
                    .iso-mid   { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
                    .iso-front { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
                    .iso-wrap:hover .iso-back { transform: rotate(180deg) translate(-6px, 6px); }
                    .iso-wrap:hover .iso-mid  { transform: rotate(180deg) translate(-3px, 3px); }
                `}</style>
            </defs>
            {/* Rotate 180° around the SVG centre to flip W → M */}
            <g className="iso-wrap" transform="rotate(180, 60, 50)">
                {/* Shadow */}
                <path
                    d="M18 80 L30 50 L42 68 L54 50 L66 80"
                    stroke="#6c63ff"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.12"
                    filter="url(#iso-blur)"
                    transform="translate(4,6)"
                    className="iso-back"
                />
                {/* Back layer */}
                <path
                    d="M18 80 L30 50 L42 68 L54 50 L66 80"
                    stroke="#a78bfa"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.45"
                    className="iso-back"
                />
                {/* Mid layer */}
                <path
                    d="M22 74 L34 44 L46 62 L58 44 L70 74"
                    stroke="#7c6ff7"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.65"
                    className="iso-mid"
                />
                {/* Front layer */}
                <path
                    d="M26 68 L38 38 L50 56 L62 38 L74 68"
                    stroke="#6c63ff"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="iso-front"
                />
                {/* Connector dots */}
                <circle cx="26" cy="68" r="3" fill="#a78bfa" opacity="0.5" />
                <circle cx="74" cy="68" r="3" fill="#a78bfa" opacity="0.5" />
                <circle cx="38" cy="62" r="3" fill="#6c63ff" />
                <circle cx="62" cy="62" r="3" fill="#6c63ff" />
                {/* Depth lines */}
                <line
                    x1="18"
                    y1="80"
                    x2="26"
                    y2="68"
                    stroke="#6c63ff"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    opacity="0.4"
                />
                <line
                    x1="66"
                    y1="80"
                    x2="74"
                    y2="68"
                    stroke="#6c63ff"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    opacity="0.4"
                />
            </g>
        </svg>
    );
}
