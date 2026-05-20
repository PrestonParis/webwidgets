import { createContext, useContext } from 'react';

export const RemoveWidgetContext = createContext<(() => void) | null>(null);
export const useRemoveWidget = () => useContext(RemoveWidgetContext);
