'use client';

import { useState } from 'react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@/features/ui/components/Modal';
import { lookupBarcode } from '@/features/tracking/lib/meal/nutrition/providers';
import type { FoodSearchResult } from '@/features/tracking/lib/meal/nutrition/foodTypes';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';

interface BarcodeModalProps {
    open: boolean;
    onClose: () => void;
    onResult: (result: FoodSearchResult) => void;
}

const inputCls =
    'w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-green-400';

/**
 * Barcode lookup modal.
 *
 * No camera/scanner library is installed, so this ships the manual-entry
 * fallback: type/paste a barcode and look it up via Open Food Facts. When a
 * camera scanning library is later added, the scanner UI can mount above the
 * input without changing the lookup flow.
 */
export function BarcodeModal({ open, onClose, onResult }: BarcodeModalProps) {
    const [barcode, setBarcode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<FoodSearchResult | null>(null);
    const [alternatives, setAlternatives] = useState<FoodSearchResult[]>([]);

    const reset = () => {
        setBarcode('');
        setError('');
        setResult(null);
        setAlternatives([]);
        setLoading(false);
    };

    const close = () => {
        reset();
        onClose();
    };

    const handleLookup = async () => {
        setError('');
        setResult(null);
        setAlternatives([]);
        setLoading(true);
        try {
            const outcome = await lookupBarcode(barcode);
            if (outcome.error) {
                setError(outcome.error.message);
            } else if (outcome.result) {
                setResult(outcome.result);
                setAlternatives(outcome.alternatives);
            }
        } catch {
            setError('Lookup failed. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const pick = (r: FoodSearchResult) => {
        onResult(r);
        close();
    };

    return (
        <Modal
            open={open}
            onClose={close}
            size="md"
            aria-labelledby="barcode-modal-title"
        >
            <ModalHeader
                id="barcode-modal-title"
                title="Scan barcode"
                description="Enter a product barcode to look up nutrition automatically."
                onClose={close}
            />
            <ModalBody className="space-y-4">
                {!NUTRITION_FLAGS.barcodeScan ? (
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Barcode lookup is currently disabled.
                    </p>
                ) : (
                    <>
                        <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                            Live camera scanning is not yet available on this
                            device. Type or paste the numeric barcode below.
                        </p>
                        <div>
                            <label
                                htmlFor="barcode-input"
                                className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1"
                            >
                                Barcode (6–14 digits)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="barcode-input"
                                    type="text"
                                    inputMode="numeric"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            void handleLookup();
                                    }}
                                    placeholder="e.g. 737628064502"
                                    className={inputCls}
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleLookup()}
                                    disabled={
                                        loading || barcode.trim().length === 0
                                    }
                                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shrink-0"
                                >
                                    {loading ? 'Looking up…' : 'Look up'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500" role="alert">
                                {error}
                            </p>
                        )}

                        {result && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                                    {alternatives.length > 0
                                        ? 'Multiple matches found — choose one:'
                                        : 'Found:'}
                                </p>
                                {[result, ...alternatives].map((r) => (
                                    <button
                                        key={`${r.provider}-${r.externalId}`}
                                        type="button"
                                        onClick={() => pick(r)}
                                        className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-green-400 transition-colors"
                                    >
                                        <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                                            {r.name}
                                            {r.brand && (
                                                <span className="text-gray-400 dark:text-zinc-500 font-normal">
                                                    {' '}
                                                    · {r.brand}
                                                </span>
                                            )}
                                        </span>
                                        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                            {Math.round(r.calories)} kcal ·{' '}
                                            {Math.round(r.proteinGrams)}g P ·{' '}
                                            {Math.round(r.carbsGrams)}g C ·{' '}
                                            {Math.round(r.fatGrams)}g F
                                            <span className="ml-1">
                                                ({r.provider})
                                            </span>
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <button
                    type="button"
                    onClick={close}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    Close
                </button>
            </ModalFooter>
        </Modal>
    );
}
