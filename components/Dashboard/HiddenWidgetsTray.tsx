// components/Dashboard/HiddenWidgetsTray.tsx
import { Eye } from "lucide-react";
import { WidgetConfig } from "@/types/dashboard";

interface Props {
    hidden: WidgetConfig[];
    onRestore: (id: string) => void;
}

const LABELS: Record<string, string> = {
    journal: "Journal",
    email: "Email",
    recovery: "Recovery",
    converter: "Converter",
};

export default function HiddenWidgetsTray({ hidden, onRestore }: Props) {
    return (
        <div className="mt-10 p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
            Hidden Widgets
        </p>
        <div className="flex flex-wrap gap-2">
            {hidden.map((w) => (
            <button
                key={w.id}
                onClick={() => onRestore(w.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
                <Eye size={13} />
                {LABELS[w.type] ?? w.type}
            </button>
            ))}
        </div>
        </div>
    );
}