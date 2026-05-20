import { useState } from 'react';
import { Clipboard, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetSettingsPanelProps } from '@/features/widgets/types/widgetProps';
import type {
    WidgetSettings,
    WidgetColor,
    WidgetBackground,
} from '@/features/widgets/types/widgets';
import { colorMap, RELATIONSHIP_LABELS } from '@/features/widgets/constants';
import type { RelationshipType } from '@/features/dashboard/types/dashboard';
import { useRemoveWidget } from '@/features/dashboard/lib/RemoveWidgetContext';
import { useCopyStyleContext } from '@/features/dashboard/lib/CopyStyleContext';

type StyleSource = Pick<
    WidgetSettings,
    'color' | 'background' | 'opacity' | 'blur' | 'redact' | 'lowProfile'
>;

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
            {children}
        </p>
    );
}

function RemoveSection({ onRemove }: { onRemove: () => void }) {
    const [confirming, setConfirming] = useState(false);
    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 flex-1">
                    Remove from dashboard?
                </p>
                <button
                    onClick={() => setConfirming(false)}
                    className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onRemove}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                    Remove
                </button>
            </div>
        );
    }
    return (
        <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
            <Trash2 size={11} /> Remove from dashboard
        </button>
    );
}

// ─── copy style section ───────────────────────────────────────────────────────

interface CopyRowProps {
    id: string;
    label: string;
    src: StyleSource;
    onCopy: (src: StyleSource) => void;
}
function CopyRow({ id, label, src, onCopy }: CopyRowProps) {
    return (
        <button
            key={id}
            onClick={() => onCopy(src)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
            <span
                className={cn(
                    'w-2.5 h-2.5 rounded-full shrink-0',
                    colorMap[src.color].swatch,
                )}
            />
            {label}
        </button>
    );
}

interface CopyStyleSectionProps {
    onUpdate: (patch: Partial<WidgetSettings>) => void;
}
function CopyStyleSection({ onUpdate }: CopyStyleSectionProps) {
    const copyStyleMap = useCopyStyleContext();
    const [showPicker, setShowPicker] = useState(false);
    if (!copyStyleMap || copyStyleMap.size === 0) return null;
    const entries = [...copyStyleMap.entries()];
    const widgets = entries.filter(([, v]) => v.widgetType !== 'folder');
    const folders = entries.filter(([, v]) => v.widgetType === 'folder');
    function copy(src: {
        color: WidgetColor;
        background: WidgetBackground;
        opacity: number;
        blur: boolean;
        redact: boolean;
        lowProfile: boolean;
    }) {
        onUpdate({
            color: src.color,
            background: src.background,
            opacity: src.opacity,
            blur: src.blur,
            redact: src.redact,
            lowProfile: src.lowProfile,
        });
        setShowPicker(false);
    }
    return (
        <div className="space-y-2">
            <SectionLabel>Style</SectionLabel>
            <button
                onClick={() => setShowPicker((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
                <Clipboard size={11} /> Copy style from widget…
            </button>
            {showPicker && (
                <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {widgets.length > 0 && (
                        <>
                            <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                Widgets
                            </p>
                            {widgets.map(([id, { label, settings: src }]) => (
                                <CopyRow
                                    key={id}
                                    id={id}
                                    label={label}
                                    src={src}
                                    onCopy={copy}
                                />
                            ))}
                        </>
                    )}
                    {folders.length > 0 && (
                        <>
                            {widgets.length > 0 && (
                                <div className="border-t border-zinc-100 dark:border-zinc-700" />
                            )}
                            <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                Folders
                            </p>
                            {folders.map(([id, { label, settings: src }]) => (
                                <CopyRow
                                    key={id}
                                    id={id}
                                    label={label}
                                    src={src}
                                    onCopy={copy}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── relationship section ─────────────────────────────────────────────────────

interface RelationshipSectionProps {
    settings: WidgetSettings;
    relationship?: RelationshipType;
    onRelationshipChange: (r: RelationshipType) => void;
    widgetList: { id: string; label: string }[];
    onUpdate: (patch: Partial<WidgetSettings>) => void;
}
function RelationshipSection({
    settings,
    relationship,
    onRelationshipChange,
    widgetList,
    onUpdate,
}: RelationshipSectionProps) {
    return (
        <div className="space-y-2">
            <SectionLabel>Relationship</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map(
                    (r) => (
                        <button
                            key={r}
                            onClick={() => onRelationshipChange(r)}
                            className={cn(
                                'px-2 py-1.5 rounded-xl text-xs font-semibold transition-all text-left',
                                relationship === r
                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                            )}
                        >
                            {RELATIONSHIP_LABELS[r]}
                        </button>
                    ),
                )}
            </div>
            {settings.pinMode === 'anchor' && (
                <div className="mt-2">
                    <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                        Anchor target
                    </p>
                    <select
                        value={settings.anchorId ?? ''}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v) {
                                onUpdate({ anchorId: v });
                            } else {
                                onUpdate({});
                            }
                        }}
                        className="w-full text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    >
                        <option value="">— none —</option>
                        {widgetList.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

// ─── panel ────────────────────────────────────────────────────────────────────

export function WidgetSettingsPanel({
    open,
    settings,
    onUpdate,
    settingsSlot,
    widgetList = [],
    relationship,
    onRelationshipChange,
}: WidgetSettingsPanelProps) {
    const onRemove = useRemoveWidget();
    const crop = settings.crop ?? { top: 0, right: 0, bottom: 0, left: 0 };
    return (
        <div
            className={cn(
                'overflow-hidden transition-all duration-200',
                open ? 'max-h-300 opacity-100' : 'max-h-0 opacity-0',
            )}
        >
            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 overflow-y-auto no-scrollbar max-h-295">
                <div className="p-4 space-y-3">
                    {settingsSlot && <div>{settingsSlot}</div>}
                    <div className="space-y-3">
                        <SectionLabel>Crop</SectionLabel>
                        {(['top', 'right', 'bottom', 'left'] as const).map(
                            (edge) => (
                                <div
                                    key={edge}
                                    className="flex items-center gap-3"
                                >
                                    <span className="w-10 text-[10px] font-semibold capitalize text-zinc-500 dark:text-zinc-400">
                                        {edge}
                                    </span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={120}
                                        step={4}
                                        value={crop[edge]}
                                        onChange={(e) =>
                                            onUpdate({
                                                crop: {
                                                    ...crop,
                                                    [edge]: Number(
                                                        e.target.value,
                                                    ),
                                                },
                                            })
                                        }
                                        className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                                    />
                                    <span className="w-7 text-right text-[10px] font-mono text-zinc-400">
                                        {crop[edge]}px
                                    </span>
                                </div>
                            ),
                        )}
                        {(crop.top > 0 ||
                            crop.right > 0 ||
                            crop.bottom > 0 ||
                            crop.left > 0) && (
                            <button
                                onClick={() =>
                                    onUpdate({
                                        crop: {
                                            top: 0,
                                            right: 0,
                                            bottom: 0,
                                            left: 0,
                                        },
                                    })
                                }
                                className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                Reset crop
                            </button>
                        )}
                    </div>
                    <CopyStyleSection onUpdate={onUpdate} />
                    {onRelationshipChange && (
                        <RelationshipSection
                            settings={settings}
                            {...(relationship !== undefined
                                ? { relationship }
                                : {})}
                            onRelationshipChange={onRelationshipChange}
                            widgetList={widgetList}
                            onUpdate={onUpdate}
                        />
                    )}
                    {onRemove && <RemoveSection onRemove={onRemove} />}
                    <a
                        href="/settings"
                        className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                    >
                        <ExternalLink size={11} /> Advanced settings
                    </a>
                </div>
            </div>
        </div>
    );
}
