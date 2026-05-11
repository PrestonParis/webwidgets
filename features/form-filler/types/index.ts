export interface FormFillerProfile {
    id: string;
    user_id: string;
    name: string;
    fields: Record<string, string>;
    created_at: string;
    updated_at: string;
}

export interface FormFillerJob {
    id: string;
    user_id: string;
    profile_id: string | null;
    url: string;
    status: 'pending' | 'running' | 'done' | 'failed';
    fields_filled: Record<string, string> | null;
    screenshot: string | null; // base64 PNG
    error: string | null;
    created_at: string;
    updated_at: string;
}

// Component prop types
export interface FillFormProps {
    profiles: FormFillerProfile[];
    onStartFill: (url: string, profileId: string) => Promise<string | null>;
    onPollJob: (jobId: string) => Promise<FormFillerJob | undefined>;
}

export interface JobHistoryProps {
    jobs: FormFillerJob[];
    loading: boolean;
}

export interface ProfileEditorProps {
    profile: FormFillerProfile;
    onSave: (profile: FormFillerProfile) => Promise<void>;
}

// The standard profile field keys the UI exposes as named inputs.
// Any additional keys the user adds go in as custom fields.
export const STANDARD_FIELDS: { key: string; label: string; type?: string }[] =
    [
        { key: 'firstName', label: 'First name' },
        { key: 'lastName', label: 'Last name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'company', label: 'Company' },
        { key: 'jobTitle', label: 'Job title' },
        { key: 'website', label: 'Website', type: 'url' },
        { key: 'address', label: 'Street address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State / Province' },
        { key: 'zip', label: 'ZIP / Postal code' },
        { key: 'country', label: 'Country' },
    ];
