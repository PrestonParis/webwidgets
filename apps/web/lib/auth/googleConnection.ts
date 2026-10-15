export type GoogleReadCapability = 'gmail' | 'calendar' | 'drive';

export function googleReadScopes(capability: GoogleReadCapability) {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];
    if (capability !== 'gmail')
        scopes.push('https://www.googleapis.com/auth/calendar.events');
    if (capability === 'drive')
        scopes.push('https://www.googleapis.com/auth/drive.readonly');
    return scopes.join(' ');
}

export function startGoogleConnection(
    capability: GoogleReadCapability = 'calendar',
) {
    const params = new URLSearchParams({
        capability,
        redirect: window.location.pathname,
    });
    window.location.assign(`/api/auth/google/start?${params}`);
}
