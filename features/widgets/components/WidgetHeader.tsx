import { Settings, X, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { WidgetHeaderProps } from '@/features/widgets/types/widgets';
import { colorMap } from '@/features/widgets/constants';
import { useHideWidget } from '@/features/dashboard/contexts/HideWidgetContext';

export function WidgetHeader({
    icon,
    title,
    badge,
    settings,
    settingsOpen,
    onToggleSettings,
    showSettings,
}: WidgetHeaderProps) {
    const onHide = useHideWidget();
    const c = colorMap[settings.color];
    const isCompact = settings.size === 'compact';

    return (
        <div
            className={cn(
                'flex justify-between items-start',
                isCompact ? 'mb-3' : 'mb-6',
            )}
        >
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        'rounded-xl flex items-center justify-center shrink-0',
                        'group-hover:scale-110 transition-transform',
                        c.iconBg,
                        c.iconText,
                        isCompact ? 'w-7 h-7' : 'w-8 h-8',
                    )}
                >
                    <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                        {icon}
                    </span>
                </div>

                <h3
                    className={cn(
                        'font-bold text-gray-800 dark:text-zinc-100',
                        isCompact ? 'text-base' : 'text-lg',
                    )}
                >
                    {title}
                </h3>
            </div>

            <div className="flex items-center gap-1">
                {badge && (
                    <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        {badge}
                    </div>
                )}

                {onHide && (
                    <button
                        onClick={onHide}
                        title="Hide widget"
                        className={cn(
                            'opacity-0 group-hover:opacity-100 transition-opacity',
                            'w-7 h-7 rounded-xl flex items-center justify-center',
                            'text-gray-400 dark:text-zinc-500',
                            'hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                        )}
                    >
                        <EyeOff className="w-3.5 h-3.5" />
                    </button>
                )}

                {showSettings && onToggleSettings && (
                    <button
                        onClick={onToggleSettings}
                        className={cn(
                            'transition-opacity w-7 h-7 rounded-xl flex items-center justify-center',
                            'text-gray-400 dark:text-zinc-500',
                            'hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                            settingsOpen
                                ? 'opacity-100 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'
                                : 'opacity-0 group-hover:opacity-100',
                        )}
                    >
                        {settingsOpen ? (
                            <X className="w-3.5 h-3.5" />
                        ) : (
                            <Settings className="w-3.5 h-3.5" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
