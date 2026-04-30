export function PrivacyHeader() {
    const today = new Date().toLocaleDateString();

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
                Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
                Last updated: {today}
            </p>
        </div>
    );
}
