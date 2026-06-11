export interface Supplement {
    id: string;
    userId: string;
    name: string;
    brand?: string;
    dose?: string;
    doseAmount?: number;
    doseUnit?: string;
    servingSize?: string;
    active: boolean;
    createdAt: string;
    scheduleStart?: string;
    scheduleEnd?: string;
    scheduleType?: string;
}

export interface CreateSupplementPayload {
    name: string;
    brand?: string;
    dose?: string;
    doseAmount?: number;
    doseUnit?: string;
}
