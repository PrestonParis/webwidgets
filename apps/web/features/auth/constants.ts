export const AUTH_MODES = {
    SIGN_IN: 'signin',
    SIGN_UP: 'signup',
} as const;

export type AuthMode = (typeof AUTH_MODES)[keyof typeof AUTH_MODES];

export const AUTH_ERRORS = {
    EMAIL_CONFIRMATION: 'Check your email for a confirmation link.',
    GENERIC: 'Something went wrong.',
} as const;
