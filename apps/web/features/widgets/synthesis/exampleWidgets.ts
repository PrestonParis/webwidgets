import { CASHFLOW_FORECAST_WIDGET } from './examples/cashflowForecastWidget';
import { EMERGENCY_FUND_RUNWAY_WIDGET } from './examples/emergencyFundRunwayWidget';
import { MOOD_VS_SLEEP_WIDGET } from './examples/moodVsSleepWidget';
import { SUBSCRIPTION_RISK_WIDGET } from './examples/subscriptionRiskWidget';
import type { SynthesizedWidgetDefinition } from './widgetDefinitionInterfaces';

export { CASHFLOW_FORECAST_WIDGET } from './examples/cashflowForecastWidget';
export { EMERGENCY_FUND_RUNWAY_WIDGET } from './examples/emergencyFundRunwayWidget';
export { MOOD_VS_SLEEP_WIDGET } from './examples/moodVsSleepWidget';
export { SUBSCRIPTION_RISK_WIDGET } from './examples/subscriptionRiskWidget';

export const SYSTEM_EXAMPLE_WIDGETS: SynthesizedWidgetDefinition[] = [
    SUBSCRIPTION_RISK_WIDGET,
    CASHFLOW_FORECAST_WIDGET,
    MOOD_VS_SLEEP_WIDGET,
    EMERGENCY_FUND_RUNWAY_WIDGET,
];
