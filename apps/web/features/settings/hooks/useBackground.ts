'use client';

import { useCallback, useEffect, useState } from 'react';

export type BackgroundPreset =
    | 'default'
    | 'midnight'
    | 'slate'
    | 'forest'
    | 'ocean'
    | 'dusk'
    | 'rose'
    | 'aurora'
    | 'custom-color'
    | 'custom-image';

export interface BackgroundConfig {
    preset: BackgroundPreset;
    /** CSS color value for custom-color, data URL for custom-image */
    value?: string;
}

const STORAGE_KEY = 'dashboard-background';

const DEFAULT_CONFIG: BackgroundConfig = { preset: 'default' };

function loadConfig(): BackgroundConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as BackgroundConfig) : DEFAULT_CONFIG;
    } catch {
        return DEFAULT_CONFIG;
    }
}

// ─── module-level singleton so all useBackground() callers share one state ────

let _config: BackgroundConfig = DEFAULT_CONFIG;
const _listeners = new Set<(c: BackgroundConfig) => void>();

function broadcast(next: BackgroundConfig) {
    _config = next;
    _listeners.forEach((fn) => fn(next));
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // localStorage full — still updates in-memory
    }
}

// ─── style helpers ────────────────────────────────────────────────────────────

export function presetToStyle(config: BackgroundConfig): React.CSSProperties {
    switch (config.preset) {
        case 'midnight':
            return {
                background:
                    'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            };
        case 'slate':
            return {
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            };
        case 'forest':
            return {
                background: 'linear-gradient(135deg, #134e4a 0%, #052e16 100%)',
            };
        case 'ocean':
            return {
                background: 'linear-gradient(135deg, #0c4a6e 0%, #1e1b4b 100%)',
            };
        case 'dusk':
            return {
                background: 'linear-gradient(135deg, #1e1b4b 0%, #4c0519 100%)',
            };
        case 'rose':
            return {
                background: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)',
            };
        case 'aurora':
            return {
                background:
                    'linear-gradient(135deg, #064e3b 0%, #1e1b4b 50%, #0c4a6e 100%)',
            };
        case 'custom-color':
            return config.value ? { background: config.value } : {};
        case 'custom-image':
            return config.value
                ? {
                      backgroundImage: `url(${config.value})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundAttachment: 'fixed',
                  }
                : {};
        default:
            return {};
    }
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useBackground() {
    const [config, setLocalConfig] = useState<BackgroundConfig>(() => {
        // Hydrate module singleton from localStorage on first render
        if (_config === DEFAULT_CONFIG) {
            _config = loadConfig();
        }
        return _config;
    });

    useEffect(() => {
        _listeners.add(setLocalConfig);
        return () => {
            _listeners.delete(setLocalConfig);
        };
    }, []);

    const setConfig = useCallback((next: BackgroundConfig) => {
        broadcast(next);
    }, []);

    const style = presetToStyle(config);
    const isDefault = config.preset === 'default';

    return { config, setConfig, style, isDefault };
}
