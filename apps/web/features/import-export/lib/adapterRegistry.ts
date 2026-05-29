import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';

const _registry = new Map<string, ImportExportAdapter>();

export function registerAdapter(adapter: ImportExportAdapter): void {
    _registry.set(adapter.id, adapter);
}

export function getAdapter(id: string): ImportExportAdapter | undefined {
    return _registry.get(id);
}

export function listAdapters(): ImportExportAdapter[] {
    return Array.from(_registry.values());
}

export function hasAdapter(id: string): boolean {
    return _registry.has(id);
}

export function adapterCount(): number {
    return _registry.size;
}
