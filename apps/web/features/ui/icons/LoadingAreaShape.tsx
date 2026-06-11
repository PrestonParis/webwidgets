export function LoadingAreaShape() {
    return (
        <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient
                    id="loading-gradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                >
                    <stop
                        offset="0%"
                        className="animate-pulse"
                        stopColor="currentColor"
                        stopOpacity="0.3"
                    />
                    <stop
                        offset="100%"
                        className="animate-pulse"
                        stopColor="currentColor"
                        stopOpacity="0"
                    />
                </linearGradient>
            </defs>
            <polygon
                points="0,100 100,100 100,50 0,50"
                fill="url(#loading-gradient)"
                className="text-zinc-200 dark:text-zinc-700"
            />
        </svg>
    );
}
