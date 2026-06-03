import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';

export interface SavedWidget {
    id: string;
    name: string;
    description: string;
    category: string;
    icon?: string;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    version: number;
    definition: SynthesizedWidgetDefinition;
    created_at: string;
    updated_at: string;
}

export async function saveCustomWidget(
    definition: Partial<SynthesizedWidgetDefinition>,
): Promise<SavedWidget> {
    const res = await fetch('/api/widget-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: definition.name ?? 'Untitled Widget',
            description: definition.description ?? '',
            category: definition.category ?? 'custom',
            icon: definition.icon,
            tags: definition.metadata?.tags ?? [],
            definition,
            status: 'draft',
        }),
    });
    if (!res.ok) throw new Error('Failed to save widget');
    const { widget } = (await res.json()) as { widget: SavedWidget };
    return widget;
}

export async function listCustomWidgets(): Promise<SavedWidget[]> {
    const res = await fetch('/api/widget-builder');
    if (!res.ok) throw new Error('Failed to load widgets');
    const { widgets } = (await res.json()) as { widgets: SavedWidget[] };
    return widgets;
}

export async function updateCustomWidget(
    id: string,
    patch: Partial<SynthesizedWidgetDefinition>,
): Promise<SavedWidget> {
    const res = await fetch(`/api/widget-builder/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition: patch }),
    });
    if (!res.ok) throw new Error('Failed to update widget');
    const { widget } = (await res.json()) as { widget: SavedWidget };
    return widget;
}

export async function deleteCustomWidget(id: string): Promise<void> {
    await fetch(`/api/widget-builder/${id}`, { method: 'DELETE' });
}

export async function fetchWidgetData(
    id: string,
): Promise<Record<string, unknown[]>> {
    const res = await fetch(`/api/widget-builder/${id}/data`);
    if (!res.ok) throw new Error('Failed to fetch widget data');
    const { data } = (await res.json()) as { data: Record<string, unknown[]> };
    return data;
}
