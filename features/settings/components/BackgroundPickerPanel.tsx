'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import {
    useBackground,
    presetToStyle,
} from '@/features/settings/hooks/useBackground';
import type {
    BackgroundConfig,
    BackgroundPreset,
} from '@/features/settings/hooks/useBackground';

interface Preset {
    id: BackgroundPreset;
    label: string;
}

const PRESETS: Preset[] = [
    { id: 'default', label: 'Default' },
    { id: 'midnight', label: 'Midnight' },
    { id: 'slate', label: 'Slate' },
    { id: 'forest', label: 'Forest' },
    { id: 'ocean', label: 'Ocean' },
    { id: 'dusk', label: 'Dusk' },
    { id: 'rose', label: 'Rose' },
    { id: 'aurora', label: 'Aurora' },
];

function previewConfig(p: Preset, colorInput: string): BackgroundConfig {
    return p.id === 'custom-color'
        ? { preset: 'custom-color', value: colorInput }
        : { preset: p.id };
}

interface Props {
    compact?: boolean;
}

export function BackgroundPickerPanel({ compact = false }: Props) {
    const { config, setConfig } = useBackground();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [colorInput, setColorInput] = useState(
        config.preset === 'custom-color'
            ? (config.value ?? '#1e293b')
            : '#1e293b',
    );

    function selectPreset(preset: BackgroundPreset) {
        if (preset === 'custom-color') {
            setConfig({ preset: 'custom-color', value: colorInput });
        } else {
            setConfig({ preset });
        }
    }

    function applyCustomColor(color: string) {
        setColorInput(color);
        setConfig({ preset: 'custom-color', value: color });
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setConfig({
                preset: 'custom-image',
                value: ev.target?.result as string,
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    const cols = compact ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-8';

    return (
        <div className="space-y-4">
            {/* Header row */}
            {(!compact || config.preset !== 'default') && (
                <div className="flex items-center justify-between">
                    {!compact && (
                        <p className="text-sm font-semibold">
                            Dashboard background
                        </p>
                    )}
                    {config.preset !== 'default' && (
                        <button
                            onClick={() => setConfig({ preset: 'default' })}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ml-auto"
                        >
                            <X size={12} />
                            Reset
                        </button>
                    )}
                </div>
            )}

            {/* Preset grid */}
            <div className={`grid ${cols} gap-2`}>
                {PRESETS.map((p) => {
                    const isSelected = config.preset === p.id;
                    return (
                        <button
                            key={p.id}
                            onClick={() => selectPreset(p.id)}
                            title={p.label}
                            className={`relative rounded-lg overflow-hidden aspect-video border-2 transition-all ${
                                isSelected
                                    ? 'border-blue-500 shadow-sm shadow-blue-500/30'
                                    : 'border-gray-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                            }`}
                        >
                            <div
                                className={`absolute inset-0 ${p.id === 'default' ? 'bg-gray-100 dark:bg-zinc-900' : ''}`}
                                style={presetToStyle(
                                    previewConfig(p, colorInput),
                                )}
                            />
                            <span className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                                {p.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Custom controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Color swatch + picker */}
                <button
                    onClick={() => selectPreset('custom-color')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition ${
                        config.preset === 'custom-color'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                >
                    <span
                        className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                        style={{ background: colorInput }}
                    />
                    Color
                </button>
                <input
                    type="color"
                    value={colorInput}
                    onChange={(e) => applyCustomColor(e.target.value)}
                    className="w-7 h-7 rounded-md border border-gray-200 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
                    title="Pick a color"
                />

                {/* Image upload */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition ${
                        config.preset === 'custom-image'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                >
                    <Upload size={11} />
                    {config.preset === 'custom-image'
                        ? 'Change image'
                        : 'Image'}
                </button>
                {config.preset === 'custom-image' && config.value && (
                    <div
                        className="w-7 h-7 rounded-md border border-gray-200 dark:border-zinc-700 bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${config.value})` }}
                    />
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                />
            </div>
        </div>
    );
}
