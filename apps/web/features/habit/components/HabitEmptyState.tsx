import { Flame } from 'lucide-react';

export default function HabitEmptyState() {
    return (
        <div className="flex flex-col items-center gap-2 py-6 text-stone-400 dark:text-zinc-600">
            <Flame size={28} className="opacity-40" />
            <p className="text-xs">No habits yet. Add one to start tracking.</p>
        </div>
    );
}
