'use client';

import { Check } from 'lucide-react';
import { FOCUS_AREA_DEFINITIONS } from '@/features/onboarding/lib/goalDefinitions';
import type { FocusAreaId } from '@/features/onboarding/types/goals';
import { cn } from '@/lib/utils/utils';

interface FocusStepProps {
    selectedAreas: FocusAreaId[];
    onToggleArea: (areaId: FocusAreaId) => void;
}

export function FocusStep({ selectedAreas, onToggleArea }: FocusStepProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {FOCUS_AREA_DEFINITIONS.map((area) => {
                    const selected = selectedAreas.includes(area.id);
                    return (
                        <button
                            key={area.id}
                            type="button"
                            onClick={() => onToggleArea(area.id)}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all',
                                selected
                                    ? 'border-[#4f6ef7] bg-[#eef2ff] dark:bg-[#172033]'
                                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
                            )}
                        >
                            <span className="text-xl leading-none">
                                {area.emoji}
                            </span>
                            <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                {area.label}
                            </span>
                            <span
                                className={cn(
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                                    selected
                                        ? 'border-[#4f6ef7] bg-[#4f6ef7]'
                                        : 'border-zinc-300 dark:border-zinc-700',
                                )}
                            >
                                {selected && (
                                    <Check className="h-3 w-3 text-white" />
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {selectedAreas.length === 0
                    ? 'Select anything that applies. You can always add more later.'
                    : `${selectedAreas.length} area${selectedAreas.length === 1 ? '' : 's'} selected.`}
            </p>
        </div>
    );
}
