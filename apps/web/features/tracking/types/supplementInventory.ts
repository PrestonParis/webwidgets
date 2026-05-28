export interface SupplementInventory {
    quantityRemaining: number;
    dosesRemaining: number;
    doseSize?: number;
    reorderThreshold: number;
    expirationDate?: string;
    storageLocation?: string;
    supplier?: string;
    cost?: number;
    adjustmentHistory: Array<{
        date: string;
        delta: number;
        reason: string;
    }>;
}
