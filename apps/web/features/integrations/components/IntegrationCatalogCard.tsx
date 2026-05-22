interface IntegrationCatalogCardProps {
    name: string;
    summary: string;
    state: string;
}

export function IntegrationCatalogCard({
    name,
    summary,
    state,
}: IntegrationCatalogCardProps) {
    return (
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold">{name}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {summary}
                    </p>
                </div>
                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {state.replace('-', ' ')}
                </span>
            </div>
        </article>
    );
}
