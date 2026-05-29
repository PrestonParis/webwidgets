'use client';

import Image from 'next/image';
import { XCircle, Upload } from 'lucide-react';
import type { WidgetSettings } from '@/features/widgets/types/widgets';

interface FolderLayersPanelProps {
    settings: WidgetSettings;
    updateSettings: (patch: Partial<WidgetSettings>) => void;
    folderFileInputRef: React.RefObject<HTMLInputElement | null>;
    onUploadClick: () => void;
}

export function FolderLayersPanel({
    settings,
    updateSettings,
    folderFileInputRef,
    onUploadClick,
}: FolderLayersPanelProps) {
    return (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-3 space-y-3">
            <div>
                <div className="flex justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Opacity
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400">
                        {settings.opacity}%
                    </span>
                </div>
                <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={settings.opacity}
                    onChange={(e) =>
                        updateSettings({ opacity: Number(e.target.value) })
                    }
                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Image
                </p>
                <input
                    type="file"
                    accept="image/*"
                    ref={folderFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const result = ev.target?.result;
                            if (typeof result === 'string')
                                updateSettings({ backgroundImage: result });
                        };
                        reader.readAsDataURL(file);
                    }}
                />
                {settings.backgroundImage ? (
                    <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden h-20 bg-zinc-100 dark:bg-zinc-800">
                            <Image
                                src={settings.backgroundImage}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover"
                            />
                            <button
                                onClick={() =>
                                    updateSettings({ backgroundImage: '' })
                                }
                                className="absolute top-1 right-1 text-white bg-black/50 rounded-full p-0.5 hover:bg-black/70 transition-colors"
                            >
                                <XCircle size={14} />
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    Brightness
                                </p>
                                <span className="text-[10px] font-mono text-zinc-400">
                                    {settings.backgroundBrightness ?? 100}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={settings.backgroundBrightness ?? 100}
                                onChange={(e) =>
                                    updateSettings({
                                        backgroundBrightness: Number(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                            />
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onUploadClick}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Upload size={11} />
                        Upload image
                    </button>
                )}
            </div>
        </div>
    );
}
