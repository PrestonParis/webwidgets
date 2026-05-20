import { createContext, useContext } from 'react';

export const BucketWidgetContext = createContext<(() => void) | null>(null);

export function useBucketWidget() {
    return useContext(BucketWidgetContext);
}
