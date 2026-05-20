interface EmptyProductStateProps {
    title: string;
    description: string;
}

export function EmptyProductState({
    title,
    description,
}: EmptyProductStateProps) {
    return (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white/70 p-6 text-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                {title}
            </p>
            <p className="mt-2 leading-6 text-zinc-600 dark:text-zinc-300">
                {description}
            </p>
        </div>
    );
}
