// Centralized permission matrix for workspace roles.
// Used by both API routes (server-side) and UI (client gating).
// A user is effectively 'owner' if they created the workspace (user_id match).

export type WorkspaceRole = 'owner' | 'editor' | 'viewer' | 'automation';

type Permission =
    | 'view_workspace'
    | 'edit_workspace'
    | 'delete_workspace'
    | 'invite_member'
    | 'revoke_invite'
    | 'change_member_role'
    | 'remove_member'
    | 'create_handoff'
    | 'edit_handoff'
    | 'delete_handoff'
    | 'create_approval'
    | 'approve_reject'
    | 'add_comment'
    | 'delete_any_comment'
    | 'view_activity';

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
    owner: [
        'view_workspace',
        'edit_workspace',
        'delete_workspace',
        'invite_member',
        'revoke_invite',
        'change_member_role',
        'remove_member',
        'create_handoff',
        'edit_handoff',
        'delete_handoff',
        'create_approval',
        'approve_reject',
        'add_comment',
        'delete_any_comment',
        'view_activity',
    ],
    editor: [
        'view_workspace',
        'invite_member',
        'revoke_invite',
        'create_handoff',
        'edit_handoff',
        'create_approval',
        'approve_reject',
        'add_comment',
        'view_activity',
    ],
    viewer: ['view_workspace', 'add_comment', 'view_activity'],
    automation: [
        'view_workspace',
        'create_handoff',
        'edit_handoff',
        'view_activity',
    ],
};

export function can(
    role: WorkspaceRole | null | undefined,
    permission: Permission,
): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
