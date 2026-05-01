import { cn } from '@/lib/utils/utils';
import {
    WidgetSize,
    WidgetBackground,
    WidgetSettingsPanelProps,
} from '@/features/widgets/types/widgets';
import {
    colorMap,
    COLORS,
    SIZE_LABELS,
    BG_LABELS,
} from '@/features/widgets/constants';

export function WidgetSettingsPanel({
    open,
    settings,
    onUpdate,
    settingsSlot,
}: WidgetSettingsPanelProps) {
    return (
        <div
            className={cn(
                'overflow-hidden transition-all duration-200',
                open ? 'max-h-125 mb-4 opacity-100' : 'max-h-0 opacity-0',
            )}
        >
            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 space-y-4">
                {/* Color */}
                <div>
                    <p className="text-xs font-bold mb-2">Color</p>
                    <div className="flex gap-2">
                        {COLORS.map((col) => (
                            <button
                                key={col}
                                onClick={() => onUpdate({ color: col })}
                                className={cn(
                                    'w-6 h-6 rounded-full',
                                    colorMap[col].swatch,
                                    settings.color === col &&
                                        'ring-2 scale-110',
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Size */}
                <div>
                    <p className="text-xs font-bold mb-2">Size</p>
                    <div className="flex gap-2">
                        {(['compact', 'default', 'large'] as WidgetSize[]).map(
                            (s) => (
                                <button
                                    key={s}
                                    onClick={() => onUpdate({ size: s })}
                                    className={cn(
                                        'flex-1 py-1 rounded-xl text-xs font-bold',
                                        settings.size === s
                                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                            : 'bg-zinc-100 dark:bg-zinc-800',
                                    )}
                                >
                                    {SIZE_LABELS[s]}
                                </button>
                            ),
                        )}
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

                {settingsSlot && (
                    <div className="pt-3 border-t">{settingsSlot}</div>
                )}
            </div>
        </div>
    );
}
