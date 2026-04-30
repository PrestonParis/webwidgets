export default function HabitLoadingSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className="h-10 bg-stone-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                />
            ))}
        </div>
    );
}
