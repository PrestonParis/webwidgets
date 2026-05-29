export type CompanyRole = 'owner' | 'admin' | 'manager' | 'employee';
export type CompanyMembershipStatus = 'active' | 'invited' | 'disabled';

export interface Company {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CompanyMembership {
    id: string;
    companyId: string;
    userId: string | null;
    email: string | null;
    role: CompanyRole;
    status: CompanyMembershipStatus;
    createdAt: string;
    updatedAt: string;
}

export interface TimeclockEntry {
    id: string;
    companyId: string;
    userId: string;
    clockInAt: string;
    clockOutAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CompanyTimeclockState {
    companies: Company[];
    memberships: CompanyMembership[];
    entries: TimeclockEntry[];
    selectedCompanyId: string | null;
    activeEntry: TimeclockEntry | null;
    loading: boolean;
    error: string | null;
}
