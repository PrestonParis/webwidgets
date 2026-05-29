'use client';

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { getCategories } from '@/features/convert/types/unitconvert';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useConverterWidget } from '@/features/convert/hooks/useConverterWidget';
import { ConverterInputRow } from '@/features/convert/components/ConverterInputRow';
import { ConverterSwapButton } from '@/features/convert/components/ConverterSwapButton';
import { ConverterRateSummary } from '@/features/convert/components/ConverterRateSummary';
import ConverterWidget from '@/features/convert/components/ConverterWidget';
import { cn } from '@/lib/utils/utils';

type ConverterSection = 'general-units' | 'file-types';

export default function UnitConverterWidget() {
    const [section, setSection] = useState<ConverterSection>('general-units');
    const { settings, updateSettings } = useWidgetSettings(
        'converter',
        'converter',
    );
    const {
        category,
        units,
        validFrom,
        validTo,
        displayFrom,
        displayTo,
        conversionRate,
        ratesLoading,
        rateDate,
        handleFromChange,
        handleToChange,
        handleCategoryChange,
        handleSwap,
        setFromUnit,
        setToUnit,
    } = useConverterWidget();

    return (
        <WidgetShell
            icon={<ArrowLeftRight />}
            title="Converter"
            badge="Convert"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="converter"
            widgetType="converter"
            footerHref="/unitconvert"
            footerLabel="View full page →"
        >
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-50 p-1 dark:bg-zinc-900">
                <SectionButton
                    active={section === 'general-units'}
                    onClick={() => setSection('general-units')}
                >
                    General Units
                </SectionButton>
                <SectionButton
                    active={section === 'file-types'}
                    onClick={() => setSection('file-types')}
                >
                    File Conversion
                </SectionButton>
            </div>

            {section === 'general-units' ? (
                <>
                    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                        Category
                        <select
                            value={category}
                            onChange={(event) =>
                                handleCategoryChange(event.target.value)
                            }
                            className="h-11 rounded-2xl border border-transparent bg-gray-50 px-3 text-sm normal-case text-gray-700 outline-none dark:bg-zinc-900/50 dark:text-zinc-200"
                        >
                            {getCategories().map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="space-y-3">
                        <ConverterInputRow
                            value={displayFrom}
                            unit={validFrom}
                            units={units}
                            onValueChange={handleFromChange}
                            onUnitChange={setFromUnit}
                        />
                        <ConverterSwapButton onSwap={handleSwap} />
                        <ConverterInputRow
                            value={displayTo}
                            unit={validTo}
                            units={units}
                            onValueChange={handleToChange}
                            onUnitChange={setToUnit}
                        />
                    </div>
                    <ConverterRateSummary
                        rate={conversionRate}
                        fromUnit={validFrom}
                        toUnit={validTo}
                        rateDate={rateDate}
                        loading={ratesLoading}
                    />
                </>
            ) : (
                <ConverterWidget fullPage />
            )}
        </WidgetShell>
    );
}

function SectionButton({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'min-h-9 rounded-xl px-2 text-xs font-bold transition-colors',
                active
                    ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-100'
                    : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100',
            )}
        >
            {children}
        </button>
    );
}
