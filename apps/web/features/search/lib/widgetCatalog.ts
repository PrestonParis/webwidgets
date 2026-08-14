import type { WidgetEntry } from '../types/widgetCatalog';
import { WIDGET_CATALOG_PART_1 } from './widgetCatalogPart1';
import { WIDGET_CATALOG_PART_2 } from './widgetCatalogPart2';
import { WIDGET_CATALOG_PART_3 } from './widgetCatalogPart3';
import { WIDGET_CATALOG_PART_4 } from './widgetCatalogPart4';
import { getV1ReleaseState } from '@/lib/product/v1FeaturePolicy';

export type { WidgetEntry };

const CATALOG_ENTRIES: WidgetEntry[] = [
    ...WIDGET_CATALOG_PART_1,
    ...WIDGET_CATALOG_PART_2,
    ...WIDGET_CATALOG_PART_3,
    ...WIDGET_CATALOG_PART_4,
];

export const WIDGET_CATALOG: WidgetEntry[] = CATALOG_ENTRIES.map((entry) => ({
    ...entry,
    betaState: getV1ReleaseState(entry.type),
}));

export function searchWidgets(query: string, isAdmin = false): WidgetEntry[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return WIDGET_CATALOG.filter(
        (w) =>
            (!w.adminOnly || isAdmin) &&
            (w.name.toLowerCase().includes(q) ||
                w.description.toLowerCase().includes(q) ||
                w.keywords.some((k) => k.includes(q))),
    );
}
