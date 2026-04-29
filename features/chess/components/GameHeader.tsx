import type { GameHeaderProps, Tab } from '@/types/chess';

export function GameHeader({
    game,
    tab,
    onBack,
    onTabChange,
}: GameHeaderProps) {
    return (
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                    ← Library
                </button>
                <div>
                    <h1 className="font-semibold text-zinc-100">
                        {game.white} <span className="text-zinc-500">vs</span>{' '}
                        {game.black}
                    </h1>
                    <p className="text-xs text-zinc-500">
                        {game.event || 'Casual Game'}
                        {game.played_at
                            ? ` · ${new Date(game.played_at).toLocaleDateString()}`
                            : ''}
                        {' · '}
                        <span className="font-mono">{game.result || '*'}</span>
                    </p>
                </div>
            </div>

            <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                {(['review', 'trainer', 'studies'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => onTabChange(t)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                            tab === t
                                ? 'bg-zinc-700 text-zinc-100'
                                : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
}
