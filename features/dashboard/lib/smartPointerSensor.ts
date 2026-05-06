import { PointerSensor, type PointerSensorOptions } from '@dnd-kit/core';

const INTERACTIVE_SELECTOR =
    'input, select, textarea, button, a, [contenteditable="true"]';

export class SmartPointerSensor extends PointerSensor {
    static activators = [
        {
            eventName: 'onPointerDown' as const,
            handler: (
                event: { nativeEvent: PointerEvent },
                options: PointerSensorOptions,
            ) => {
                const { nativeEvent } = event;
                if (!nativeEvent.isPrimary || nativeEvent.button !== 0)
                    return false;
                if (
                    (nativeEvent.target as HTMLElement).closest(
                        INTERACTIVE_SELECTOR,
                    )
                )
                    return false;
                options.onActivation?.({ event: nativeEvent });
                return true;
            },
        },
    ];
}
