'use client';

import { ArrowLeftRight } from 'lucide-react';
import { getCategories } from '@/types/unitconvert';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useConverterWidget } from '@/features/convert/hooks/useConverterWidget';
import { ConverterCategoryTabs } from '@/features/convert/components/ConverterCategoryTabs';
import { ConverterInputRow } from '@/features/convert/components/ConverterInputRow';
import { ConverterSwapButton } from '@/features/convert/components/ConverterSwapButton';
import { ConverterRateSummary } from '@/features/convert/components/ConverterRateSummary';

export default function UnitConverterWidget() {
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
        >
            <ConverterCategoryTabs
                categories={getCategories()}
                active={category}
                onChange={handleCategoryChange}
            />
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
                    highlight
                />
            </div>
            <ConverterRateSummary
                rate={conversionRate}
                fromUnit={validFrom}
                toUnit={validTo}
            />
        </WidgetShell>
    );
}
