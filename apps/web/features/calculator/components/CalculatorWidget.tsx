'use client';

import { Calculator } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { CalculatorCore } from './CalculatorCore';

interface CalculatorWidgetProps {
    widgetId: string;
}

export default function CalculatorWidget({ widgetId }: CalculatorWidgetProps) {
    const { settings, updateSettings } = useWidgetSettings(
        widgetId,
        'calculator',
    );

    return (
        <WidgetShell
            icon={<Calculator size={16} />}
            title="Calculator"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId={widgetId}
            widgetType="calculator"
            footerHref="/unitconvert?tab=calculator"
            footerLabel="Full calculator →"
        >
            <CalculatorCore widgetId={widgetId} compact />
        </WidgetShell>
    );
}
