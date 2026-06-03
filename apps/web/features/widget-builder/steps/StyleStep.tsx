'use client';

import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';

interface StyleStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
}

const ACCENT_COLORS = [
    { id: 'emerald', label: 'Emerald', cls: 'bg-emerald-500' },
    { id: 'blue', label: 'Blue', cls: 'bg-blue-500' },
    { id: 'violet', label: 'Violet', cls: 'bg-violet-500' },
    { id: 'rose', label: 'Rose', cls: 'bg-rose-500' },
    { id: 'amber', label: 'Amber', cls: 'bg-amber-500' },
    { id: 'cyan', label: 'Cyan', cls: 'bg-cyan-500' },
    { id: 'zinc', label: 'Zinc', cls: 'bg-zinc-400' },
];

const DENSITY = [
    { id: 'compact', label: 'Compact', desc: 'High density, small text' },
    { id: 'default', label: 'Default', desc: 'Balanced spacing' },
    { id: 'spacious', label: 'Spacious', desc: 'More breathing room' },
];

const BORDER_RADIUS = [
    { id: 'none', label: 'Square' },
    { id: 'sm', label: 'Subtle' },
    { id: 'md', label: 'Rounded' },
    { id: 'lg', label: 'Soft' },
    { id: 'xl', label: 'Pill' },
];

function getStyle(
    def: Partial<SynthesizedWidgetDefinition>,
): Record<string, string> {
    return (
        ((def as Record<string, unknown>).style as Record<string, string>) ?? {}
    );
}

export function StyleStep({ definition, onUpdate }: StyleStepProps) {
    const style = getStyle(definition);

    const updateStyle = (key: string, value: string) => {
        onUpdate({
            ...definition,
            style: { ...style, [key]: value },
        } as Partial<SynthesizedWidgetDefinition>);
    };

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Accent color
                </p>
                <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => updateStyle('accentColor', c.id)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${style.accentColor === c.id ? 'border-white/30 bg-white/10 text-white' : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'}`}
                        >
                            <span className={`h-3 w-3 rounded-full ${c.cls}`} />
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Density
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {DENSITY.map((d) => (
                        <button
                            key={d.id}
                            onClick={() => updateStyle('density', d.id)}
                            className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors ${style.density === d.id ? 'border-emerald-600 bg-emerald-950/30' : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'}`}
                        >
                            <p
                                className={`text-xs font-medium ${style.density === d.id ? 'text-emerald-400' : 'text-zinc-300'}`}
                            >
                                {d.label}
                            </p>
                            <p className="text-[10px] text-zinc-600">
                                {d.desc}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Corner radius
                </p>
                <div className="flex gap-2">
                    {BORDER_RADIUS.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => updateStyle('borderRadius', r.id)}
                            className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${style.borderRadius === r.id ? 'border-emerald-600 bg-emerald-950/30 text-emerald-400' : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Header style
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        {
                            id: 'default',
                            label: 'Default',
                            desc: 'Title + subtitle',
                        },
                        {
                            id: 'minimal',
                            label: 'Minimal',
                            desc: 'Title only, no border',
                        },
                        {
                            id: 'colored',
                            label: 'Colored',
                            desc: 'Accent background header',
                        },
                        {
                            id: 'hidden',
                            label: 'Hidden',
                            desc: 'No header, content only',
                        },
                    ].map((h) => (
                        <button
                            key={h.id}
                            onClick={() => updateStyle('headerStyle', h.id)}
                            className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors ${style.headerStyle === h.id ? 'border-emerald-600 bg-emerald-950/30' : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'}`}
                        >
                            <p
                                className={`text-xs font-medium ${style.headerStyle === h.id ? 'text-emerald-400' : 'text-zinc-300'}`}
                            >
                                {h.label}
                            </p>
                            <p className="text-[10px] text-zinc-600">
                                {h.desc}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
