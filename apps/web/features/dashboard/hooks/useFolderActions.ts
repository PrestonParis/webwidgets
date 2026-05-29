'use client';

import { useState, useCallback } from 'react';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';

function maxMainOrder(layout: WidgetConfig[]): number {
    return layout
        .filter((w) => w.containerId === 'main')
        .reduce((max, w) => Math.max(max, w.order), -1);
}

export function useFolderActions(
    layout: WidgetConfig[],
    updateLayout: (next: WidgetConfig[]) => void,
) {
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

    const addFolder = useCallback(() => {
        const id = `folder-${Date.now()}`;
        const maxOrder = layout.reduce((max, w) => Math.max(max, w.order), -1);
        updateLayout([
            ...layout,
            {
                id,
                type: 'folder',
                visible: true,
                columnSpan: 1,
                containerId: 'main',
                order: maxOrder + 1,
                props: { folderName: 'New Folder' },
            },
        ]);
    }, [layout, updateLayout]);

    const renameFolder = useCallback(
        (id: string, name: string) => {
            updateLayout(
                layout.map((w) =>
                    w.id === id
                        ? { ...w, props: { ...w.props, folderName: name } }
                        : w,
                ),
            );
        },
        [layout, updateLayout],
    );

    const deleteFolder = useCallback(
        (id: string) => {
            const max = maxMainOrder(layout);
            let offset = 0;
            const next = layout
                .filter((w) => w.id !== id)
                .map((w) => {
                    if (w.containerId === id) {
                        offset += 1;
                        return {
                            ...w,
                            containerId: 'main',
                            order: max + offset,
                        };
                    }
                    return w;
                });
            updateLayout(next);
            if (activeFolderId === id) setActiveFolderId(null);
        },
        [layout, updateLayout, activeFolderId],
    );

    const removeFromFolder = useCallback(
        (widgetId: string) => {
            updateLayout(
                layout.map((w) =>
                    w.id === widgetId
                        ? {
                              ...w,
                              containerId: 'main',
                              order: maxMainOrder(layout) + 1,
                          }
                        : w,
                ),
            );
        },
        [layout, updateLayout],
    );

    const moveToBucket = useCallback(
        (widgetId: string) => {
            updateLayout(
                layout.map((w) =>
                    w.id === widgetId
                        ? { ...w, containerId: 'bucket', visible: true }
                        : w,
                ),
            );
        },
        [layout, updateLayout],
    );

    const restoreFromBucket = useCallback(
        (widgetId: string) => {
            updateLayout(
                layout.map((w) =>
                    w.id === widgetId
                        ? {
                              ...w,
                              containerId: 'main',
                              order: maxMainOrder(layout) + 1,
                              visible: true,
                          }
                        : w,
                ),
            );
        },
        [layout, updateLayout],
    );

    const unpresentWidget = useCallback(
        (widgetId: string) => {
            updateLayout(
                layout.map((w) =>
                    w.id === widgetId
                        ? { ...w, unpresented: true, visible: false }
                        : w,
                ),
            );
        },
        [layout, updateLayout],
    );

    const restoreUnpresented = useCallback(
        (widgetId: string) => {
            updateLayout(
                layout.map((w) =>
                    w.id === widgetId
                        ? {
                              ...w,
                              unpresented: false,
                              visible: true,
                              containerId: 'main',
                              order: maxMainOrder(layout) + 1,
                          }
                        : w,
                ),
            );
        },
        [layout, updateLayout],
    );

    return {
        activeFolderId,
        setActiveFolderId,
        addFolder,
        renameFolder,
        deleteFolder,
        removeFromFolder,
        moveToBucket,
        restoreFromBucket,
        unpresentWidget,
        restoreUnpresented,
    };
}
