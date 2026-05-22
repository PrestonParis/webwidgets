import Header from '@/features/ui/components/Header';

export default function Loading() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 md:px-6">
                <div className="mx-auto max-w-6xl space-y-5">
                    <div className="space-y-2">
                        <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-4 w-full max-w-2xl rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
                        <div className="space-y-4">
                            <div className="h-64 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
                            <div className="h-80 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
                        </div>
                        <div className="h-96 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
                    </div>
                </div>
            </main>
        </>
    );
}
