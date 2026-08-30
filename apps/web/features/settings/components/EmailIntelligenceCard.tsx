'use client';

interface EmailIntelligenceCardProps {
    useAI: boolean;
    apiKey: string;
    hasApiKey: boolean;
    saving: boolean;
    onToggleAI: () => void;
    onApiKeyChange: (key: string) => void;
    onSave: () => void;
}

export function EmailIntelligenceCard({
    useAI,
    apiKey,
    hasApiKey,
    saving,
    onToggleAI,
    onApiKeyChange,
    onSave,
}: EmailIntelligenceCardProps) {
    return (
        <div className="space-y-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    Email Intelligence
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                    By default, emails are classified using rule-based matching.
                    Enable AI for smarter classification and action extraction.
                </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                        Use AI processing
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        Claude classifies emails and extracts action items
                    </p>
                </div>
                <button
                    onClick={onToggleAI}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                        useAI ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                    }`}
                    role="switch"
                    aria-checked={useAI}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            useAI ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>

            {useAI && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        Anthropic API Key{' '}
                        <span className="font-normal text-gray-400">
                            (optional, uses shared key if blank)
                        </span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            placeholder={
                                hasApiKey
                                    ? 'Key saved — enter a replacement'
                                    : 'sk-ant-api03-...'
                            }
                            className="flex-1 text-xs bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="text-xs font-semibold px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
