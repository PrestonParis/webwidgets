'use client';

import type { SimplifiedDashboardProps } from '@/features/dashboard/types/dashboard';
import { renderWidgetContent } from '@/features/dashboard/lib/renderWidgetContent';
import { HideWidgetContext } from '@/features/dashboard/lib/HideWidgetContext';
import { RemoveWidgetContext } from '@/features/dashboard/lib/RemoveWidgetContext';
import { BucketWidgetContext } from '@/features/dashboard/lib/BucketWidgetContext';
import { UnpresentWidgetContext } from '@/features/dashboard/lib/UnpresentWidgetContext';
import { StatusDot } from '@/features/notifications/components/StatusDot';
import { ViewportWidgetMount } from './ViewportWidgetMount';
import { WidgetBodyBudgetProvider } from './WidgetBodyBudget';
import { getWidgetEmoji, getWidgetLabel } from './freeCanvasUtils';
import { DashboardRuntimeControls } from './DashboardRuntimeControls';

const DENSE_SIMPLIFIED_WIDGET_THRESHOLD = 12;
const DENSE_SIMPLIFIED_BODY_BUDGET = 4;

export function SimplifiedDashboard({
    layout,
    onLayoutChange,
    onToggleVisible,
    onReset,
}: SimplifiedDashboardProps) {
    const visible = layout
        .filter(
            (w) =>
                w.visible &&
                w.containerId === 'main' &&
                w.unpresented !== true &&
                w.type !== 'folder',
        )
        .sort((a, b) => a.order - b.order);

    function handleRemove(id: string) {
        onLayoutChange(layout.filter((w) => w.id !== id));
    }
    const denseLayout = visible.length > DENSE_SIMPLIFIED_WIDGET_THRESHOLD;

    if (visible.length === 0) {
        return (
            <div className="simplified-dashboard flex flex-col items-center justify-center py-32 text-zinc-400 dark:text-zinc-600">
                <p className="text-xl font-semibold mb-2">No widgets visible</p>
                <p className="text-base">
                    Use the Add button above to add widgets.
                </p>
            </div>
        );
    }

    return (
        <WidgetBodyBudgetProvider
            enabled={denseLayout}
            maxActive={DENSE_SIMPLIFIED_BODY_BUDGET}
        >
            <DashboardRuntimeControls />
            <div className="simplified-dashboard flex flex-col">
                {visible.map((config, index) => (
                    <div
                        key={config.id}
                        className="simplified-widget-item relative"
                    >
                        <HideWidgetContext.Provider
                            value={() => onToggleVisible(config.id)}
                        >
                            <RemoveWidgetContext.Provider
                                value={() => handleRemove(config.id)}
                            >
                                <BucketWidgetContext.Provider value={null}>
                                    <UnpresentWidgetContext.Provider
                                        value={null}
                                    >
                                        <div className="relative">
                                            {config.type !== 'folder' && (
                                                <StatusDot
                                                    widgetId={config.id}
                                                    className="absolute top-3 right-3 z-20"
                                                />
                                            )}
                                            <ViewportWidgetMount
                                                widgetId={config.id}
                                                config={config}
                                                eager={index < 2}
                                                label={getWidgetLabel(config)}
                                                emoji={getWidgetEmoji(config)}
                                                render={() =>
                                                    renderWidgetContent(
                                                        config,
                                                        onReset,
                                                    )
                                                }
                                            />
                                        </div>
                                    </UnpresentWidgetContext.Provider>
                                </BucketWidgetContext.Provider>
                            </RemoveWidgetContext.Provider>
                        </HideWidgetContext.Provider>
                    </div>
                ))}
            </div>
        </WidgetBodyBudgetProvider>
    );
}
