'use client';

type AnatomyView =
    | 'surface'
    | 'muscle'
    | 'bone'
    | 'nerve'
    | 'tendon'
    | 'tooth'
    | 'general';

export const LAYER_OPTIONS: { id: AnatomyView; label: string }[] = [
    { id: 'surface', label: 'Skin' },
    { id: 'muscle', label: 'Muscle' },
    { id: 'bone', label: 'Bone' },
    { id: 'tooth', label: 'Teeth' },
    { id: 'nerve', label: 'Nerve' },
    { id: 'tendon', label: 'Tendon' },
];

export const BODY_MAP_LAYERS_KEY = 'tracking_body_map_layers';
export const BODY_MAP_VIEW_KEY = 'tracking_body_map_view';

interface LayerTogglePanelProps {
    activeLayers: Set<string>;
    onChange: (layers: Set<string>) => void;
}

export function LayerTogglePanel({
    activeLayers,
    onChange,
}: LayerTogglePanelProps) {
    function toggle(id: AnatomyView) {
        onChange(new Set([id]));
    }

    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {LAYER_OPTIONS.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        activeLayers.has(opt.id)
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'border-gray-200 text-gray-400 dark:border-zinc-700 dark:text-zinc-500'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
