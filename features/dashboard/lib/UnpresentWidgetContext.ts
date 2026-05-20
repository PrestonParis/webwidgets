import { createContext, useContext } from 'react';

export const UnpresentWidgetContext = createContext<(() => void) | null>(null);

export function useUnpresentWidget() {
    return useContext(UnpresentWidgetContext);
}
