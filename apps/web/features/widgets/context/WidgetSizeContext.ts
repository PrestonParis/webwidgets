import { createContext, useContext } from 'react';
import type { WidgetSize } from '@/features/widgets/types/widgets';

export const WidgetSizeContext = createContext<WidgetSize>('default');

export function useWidgetSize(): WidgetSize {
    return useContext(WidgetSizeContext);
}
