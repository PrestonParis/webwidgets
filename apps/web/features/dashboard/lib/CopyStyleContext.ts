import { createContext, useContext } from 'react';
import type { WidgetSettings } from '@/features/widgets/types/widgets';

/** Returns all other widget settings keyed by id for copy-style functionality */
export const CopyStyleContext = createContext<Map<
    string,
    { label: string; widgetType: string; settings: WidgetSettings }
> | null>(null);

export function useCopyStyleContext() {
    return useContext(CopyStyleContext);
}
