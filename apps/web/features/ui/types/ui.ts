export interface SignOutModalProps {
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export interface AccountDropdownProps {
    firstName: string | null;
    isAdmin: boolean;
    open: boolean;
    loading: boolean;
    onToggle: () => void;
    onSignOut: () => void;
}
