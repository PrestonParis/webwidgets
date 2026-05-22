import { createContext, useContext } from 'react';

export const HideWidgetContext = createContext<(() => void) | null>(null);
export const useHideWidget = () => useContext(HideWidgetContext);
