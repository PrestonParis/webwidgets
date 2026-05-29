'use client';

import type { ComponentType } from 'react';
import { cn } from '@/lib/utils/utils';
import type { CreativeTool } from '../types/creative';

interface CreativeToolItem {
    id: CreativeTool;
    label: string;
    icon: ComponentType<{ size?: number }>;
}

interface CreativeToolsPanelProps {
    tools: CreativeToolItem[];
    activeTool: CreativeTool;
    setActiveTool: (id: CreativeTool) => void;
}

export function CreativeToolsPanel({
    tools,
    activeTool,
    setActiveTool,
}: CreativeToolsPanelProps) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Tools
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                        <button
                            key={tool.id}
                            type="button"
                            onClick={() => setActiveTool(tool.id)}
                            title={tool.label}
                            className={cn(
                                'flex h-12 flex-col items-center justify-center gap-1 rounded-lg border text-xs font-medium transition',
                                activeTool === tool.id
                                    ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300',
                            )}
                        >
                            <Icon size={15} />
                            {tool.label}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
