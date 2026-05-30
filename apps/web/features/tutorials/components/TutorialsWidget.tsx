'use client';

import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { tutorialTracks, tutorialLessons } from '../data';

export default function TutorialsWidget({
    widgetId = 'tutorials',
}: {
    widgetId?: string;
}) {
    const tracks = tutorialTracks.slice(0, 3);
    const inProgress = tutorialLessons.filter(
        (l) => l.status === 'in-progress',
    ).length;

    return (
        <WidgetShell
            icon={<GraduationCap size={16} />}
            title="Tutorials"
            badge={
                inProgress > 0 ? (
                    <span className="text-[10px] font-bold text-blue-500">
                        {inProgress} ACTIVE
                    </span>
                ) : undefined
            }
            widgetId={widgetId}
            widgetType="tutorials"
            footerHref="/tutorials"
            footerLabel="Continue learning ->"
        >
            <div className="space-y-2.5">
                {tracks.map((t) => {
                    const Icon = t.icon;
                    const pct = Math.round(t.completion * 100);
                    return (
                        <div key={t.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Icon
                                    size={13}
                                    className="text-zinc-400 shrink-0"
                                />
                                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                    {t.title}
                                </p>
                                <span className="text-[10px] text-zinc-400 shrink-0">
                                    {pct}%
                                </span>
                            </div>
                            <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        pct === 100
                                            ? 'bg-emerald-500'
                                            : pct > 0
                                              ? 'bg-blue-500'
                                              : 'bg-zinc-300 dark:bg-zinc-700',
                                    )}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </WidgetShell>
    );
}
