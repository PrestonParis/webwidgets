export function GmailLogo({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M6 18V6.825L12 11.4l6-4.575V18H6z" fill="#EA4335" />
            <path d="M3 19.5h3V12L3 9v10a.5.5 0 0 0 .5.5H3z" fill="#34A853" />
            <path d="M18 19.5h3a.5.5 0 0 0 .5-.5V9l-3 3v7.5z" fill="#4285F4" />
            <path d="M3 9l9 6.75L21 9l-9-6.75L3 9z" fill="#FBBC04" />
            <path d="M3 9l9 6.75V4.5L3 9z" fill="#EA4335" />
            <path d="M21 9L12 4.5v11.25L21 9z" fill="#1967D2" />
        </svg>
    );
}

export function OutlookLogo({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="13" height="16" rx="1.5" fill="#0078D4" />
            <path d="M8.5 8a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" fill="#fff" />
            <path d="M15 8.5h7v7h-7z" fill="#0078D4" />
            <path
                d="M15 8.5l3.5 3.5L22 8.5M15 15.5l3.5-3.5 3.5 3.5"
                stroke="#fff"
                strokeWidth="1.2"
                fill="none"
            />
        </svg>
    );
}
