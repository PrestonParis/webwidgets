'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

export type Density = 'comfortable' | 'standard' | 'compact';

export interface AccessibilityState {
    contrast: boolean;
    reducedMotion: boolean;
    focusOutlines: boolean;
    density: Density;
    transcriptionFirst: boolean;
    oneDimensionalMode: boolean;
}

export interface AccessibilityContextValue extends AccessibilityState {
    setContrast: (v: boolean) => void;
    setReducedMotion: (v: boolean) => void;
    setFocusOutlines: (v: boolean) => void;
    setDensity: (v: Density) => void;
    setTranscriptionFirst: (v: boolean) => void;
    setOneDimensionalMode: (v: boolean) => void;
    update: (patch: Partial<AccessibilityState>) => void;
}

const STORAGE_KEY = 'accessibility_prefs';

const defaults: AccessibilityState = {
    contrast: false,
    reducedMotion: false,
    focusOutlines: true,
    density: 'standard',
    transcriptionFirst: false,
    oneDimensionalMode: false,
};

function readStorage(): AccessibilityState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw)
            return {
                ...defaults,
                ...(JSON.parse(raw) as Partial<AccessibilityState>),
            };
    } catch {}
    return defaults;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
    null,
);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AccessibilityState>(readStorage);

    useEffect(() => {
        const body = document.body;

        if (state.contrast) {
            body.setAttribute('data-accessibility-contrast', '');
        } else {
            body.removeAttribute('data-accessibility-contrast');
        }

        const prefersReduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (state.reducedMotion || prefersReduced) {
            body.setAttribute('data-reduced-motion', '');
        } else {
            body.removeAttribute('data-reduced-motion');
        }

        if (state.focusOutlines) {
            body.setAttribute('data-focus-outlines', '');
        } else {
            body.removeAttribute('data-focus-outlines');
        }

        body.setAttribute('data-density', state.density);

        if (state.oneDimensionalMode) {
            body.setAttribute('data-1d-mode', '');
        } else {
            body.removeAttribute('data-1d-mode');
        }
    }, [state]);

    // Also respond to OS-level prefers-reduced-motion changes
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = () => {
            if (mq.matches) {
                document.body.setAttribute('data-reduced-motion', '');
            } else if (!state.reducedMotion) {
                document.body.removeAttribute('data-reduced-motion');
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [state.reducedMotion]);

    const update = useCallback((patch: Partial<AccessibilityState>) => {
        setState((prev) => {
            const next = { ...prev, ...patch };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
        });
    }, []);

    const value: AccessibilityContextValue = {
        ...state,
        setContrast: (v) => update({ contrast: v }),
        setReducedMotion: (v) => update({ reducedMotion: v }),
        setFocusOutlines: (v) => update({ focusOutlines: v }),
        setDensity: (v) => update({ density: v }),
        setTranscriptionFirst: (v) => update({ transcriptionFirst: v }),
        setOneDimensionalMode: (v) => update({ oneDimensionalMode: v }),
        update,
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility(): AccessibilityContextValue {
    const ctx = useContext(AccessibilityContext);
    if (!ctx)
        throw new Error(
            'useAccessibility must be used within AccessibilityProvider',
        );
    return ctx;
}
