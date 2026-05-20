'use client';

import { useEffect, useState } from 'react';
import { EyeOff, Archive, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { WIDGET_CATALOG } from '@/features/search/lib/widgetCatalog';
import {
    makePersistKey,
    readCachedLayout,
} from '@/features/dashboard/lib/dashboardLayout';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

type WidgetStatus =
    | 'visible'
    | 'hidden'
    | 'bucketed'
    | 'unpresented'
    | 'in-folder';

interface WidgetRowProps {
    widget: WidgetConfig;
    onHide: (id: string) => void;
    onMakeVisible: (id: string) => void;
    onMoveToBucket: (id: string) => void;
    onRemove: (id: string) => void;
}

const STATUS_LABELS: Record<WidgetStatus, string> = {
    visible: 'Visible',
    hidden: 'Hidden',
    bucketed: 'Bucketed',
    unpresented: 'Unpresented',
    'in-folder': 'In folder',
};

const STATUS_COLORS: Record<WidgetStatus, string> = {
    visible:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    hidden: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    bucketed:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    unpresented:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'in-folder':
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function getStatus(w: WidgetConfig): WidgetStatus {
    if (w.unpresented) return 'unpresented';
    if (w.containerId === 'bucket') return 'bucketed';
    if (w.containerId !== 'main' && w.type !== 'folder') return 'in-folder';
    if (!w.visible) return 'hidden';
    return 'visible';
}

function widgetLabel(w: WidgetConfig) {
    const entry = WIDGET_CATALOG.find((c) => c.type === w.type);
    return entry ? `${entry.emoji} ${entry.name}` : w.type;
}

function persistLayout(userId: string, layout: WidgetConfig[]) {
    try {
        localStorage.setItem(makePersistKey(userId), JSON.stringify(layout));
    } catch {}
    void supabase.from('dashboard_layouts').upsert(
        {
            user_id: userId,
            layout: layout as unknown as import('@/types/supabase').Json,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
    );
}

function groupWidgets(widgets: WidgetConfig[]) {
    const grouped: Record<WidgetStatus, WidgetConfig[]> = {
        visible: [],
        hidden: [],
        bucketed: [],
        unpresented: [],
        'in-folder': [],
    };
    for (const widget of widgets) grouped[getStatus(widget)].push(widget);
    return grouped;
}

function WidgetManagerHeader() {
    return (
        <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Widgets
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
                Manage visibility and placement for all widgets
            </p>
        </div>
    );
}

function SummaryChips({
    grouped,
}: {
    grouped: Record<WidgetStatus, WidgetConfig[]>;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {(Object.entries(grouped) as [WidgetStatus, WidgetConfig[]][])
                .filter(([, widgets]) => widgets.length > 0)
                .map(([status, widgets]) => (
                    <span
                        key={status}
                        className={cn(
                            'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
                            STATUS_COLORS[status],
                        )}
                    >
                        {widgets.length} {STATUS_LABELS[status]}
                    </span>
                ))}
        </div>
    );
}

function StatusBadge({ status }: { status: WidgetStatus }) {
    return (
        <span
            className={cn(
                'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                STATUS_COLORS[status],
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}

function WidgetRow(props: WidgetRowProps) {
    const { widget } = props;
    const status = getStatus(widget);
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {widgetLabel(widget)}
                </p>
                <StatusBadge status={status} />
            </div>
            <WidgetActions {...props} status={status} />
        </div>
    );
}

function WidgetActions({
    widget,
    status,
    onHide,
    onMakeVisible,
    onMoveToBucket,
    onRemove,
}: WidgetRowProps & { status: WidgetStatus }) {
    return (
        <div className="flex items-center gap-1 shrink-0">
            {status !== 'visible' && (
                <IconButton
                    title="Make visible on dashboard"
                    onClick={() => onMakeVisible(widget.id)}
                    className="hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                    <RotateCcw size={13} />
                </IconButton>
            )}
            {status === 'visible' && (
                <IconButton
                    title="Hide from dashboard"
                    onClick={() => onHide(widget.id)}
                    className="hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    <EyeOff size={13} />
                </IconButton>
            )}
            {status !== 'bucketed' && (
                <IconButton
                    title="Move to bucket"
                    onClick={() => onMoveToBucket(widget.id)}
                    className="hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                    <Archive size={13} />
                </IconButton>
            )}
            <IconButton
                title="Remove widget permanently"
                onClick={() => onRemove(widget.id)}
                className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
                <Trash2 size={13} />
            </IconButton>
        </div>
    );
}

function IconButton({
    children,
    className,
    title,
    onClick,
}: {
    children: React.ReactNode;
    className: string;
    title: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                'p-1.5 rounded-lg text-zinc-400 transition-colors',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function WidgetManagerCard() {
    const { user } = useAuth();
    const [layout, setLayout] = useState<WidgetConfig[] | null>(null);

    useEffect(() => {
        if (!user?.id) return;
        const cached = readCachedLayout(user.id);
        if (cached) {
            queueMicrotask(() => setLayout(cached));
            return;
        }
        void supabase
            .from('dashboard_layouts')
            .select('layout')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.layout)
                    setLayout(data.layout as unknown as WidgetConfig[]);
            });
    }, [user?.id]);

    function update(next: WidgetConfig[]) {
        setLayout(next);
        if (user?.id) persistLayout(user.id, next);
    }

    if (!layout) return <LoadingCard />;

    const displayWidgets = layout.filter((w) => w.type !== 'recovery-empty');
    const grouped = groupWidgets(displayWidgets);
    const updateWidget = (id: string, patch: Partial<WidgetConfig>) =>
        update(layout.map((w) => (w.id === id ? { ...w, ...patch } : w)));

    return (
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
            <WidgetManagerHeader />
            <SummaryChips grouped={grouped} />
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {displayWidgets.map((widget) => (
                    <WidgetRow
                        key={widget.id}
                        widget={widget}
                        onHide={(id) => updateWidget(id, { visible: false })}
                        onMakeVisible={(id) =>
                            updateWidget(id, {
                                visible: true,
                                containerId: 'main',
                                unpresented: false,
                            })
                        }
                        onMoveToBucket={(id) =>
                            updateWidget(id, {
                                containerId: 'bucket',
                                visible: true,
                            })
                        }
                        onRemove={(id) =>
                            update(layout.filter((w) => w.id !== id))
                        }
                    />
                ))}
            </div>
            {displayWidgets.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-4">
                    No widgets on your dashboard yet
                </p>
            )}
        </div>
    );
}

function LoadingCard() {
    return (
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-400">Loading widgets…</p>
        </div>
    );
}
