export function Checkmark({ size = 4 }: { size?: number }) {
    return (
        <svg
            viewBox="0 0 10 8"
            className={`w-${size} h-${size} text-white fill-current`}
        >
            <path
                d="M1 4l3 3 5-6"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
