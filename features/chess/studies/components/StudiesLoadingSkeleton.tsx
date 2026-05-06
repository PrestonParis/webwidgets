export default function StudiesLoadingSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="h-20 bg-zinc-800 rounded-xl animate-pulse"
                />
            ))}
        </div>
    );
}
