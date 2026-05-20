import { cn } from '@/lib/utils/utils';
import { colorMap, COLORS, BG_LABELS } from '@/features/widgets/constants';
import type { WidgetBackground } from '@/features/widgets/types/widgets';
import type { FolderSettings } from '@/features/dashboard/hooks/useFolderSettings';

interface FolderSettingsPanelProps {
    open: boolean;
    settings: FolderSettings;
    onUpdate: (patch: Partial<FolderSettings>) => void;
}

function Slider({
    label,
    value,
    min,
    max,
    displayValue,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    displayValue: string;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold">{label}</p>
                <span className="text-xs text-zinc-400 tabular-nums">
                    {displayValue}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-blue-500"
            />
        </div>
    );
}

export function FolderSettingsPanel({
    open,
    settings,
    onUpdate,
}: FolderSettingsPanelProps) {
    return (
        <div
            className={cn(
                'overflow-hidden transition-all duration-200',
                open ? 'max-h-80 mb-3 opacity-100' : 'max-h-0 opacity-0',
            )}
        >
            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3 space-y-3">
                {/* Color */}
                <div>
                    <p className="text-xs font-bold mb-2">Color</p>
                    <div className="flex gap-2">
                        {COLORS.map((col) => (
                            <button
                                key={col}
                                onClick={() => onUpdate({ color: col })}
                                className={cn(
                                    'w-5 h-5 rounded-full transition-transform',
                                    colorMap[col].swatch,
                                    settings.color === col &&
                                        'ring-2 scale-110',
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Background */}
                <div>
                    <p className="text-xs font-bold mb-2">Background</p>
                    <div className="flex gap-2">
                        {(
                            ['default', 'glass', 'solid'] as WidgetBackground[]
                        ).map((bg) => (
                            <button
                                key={bg}
                                onClick={() => onUpdate({ background: bg })}
                                className={cn(
                                    'flex-1 py-1 rounded-xl text-xs font-bold',
                                    settings.background === bg
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800',
                                )}
                            >
                                {BG_LABELS[bg]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Opacity — 0 = solid, 100 = transparent */}
                <Slider
                    label="Transparency"
                    value={settings.opacity}
                    min={0}
                    max={100}
                    displayValue={`${settings.opacity}%`}
                    onChange={(v) => onUpdate({ opacity: v })}
                />

                {/* Brightness */}
                <Slider
                    label="Brightness"
                    value={settings.brightness}
                    min={20}
                    max={180}
                    displayValue={`${settings.brightness}%`}
                    onChange={(v) => onUpdate({ brightness: v })}
                />
            </div>
        </div>
    );
}
