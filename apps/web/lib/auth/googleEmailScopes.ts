import { googleReadScopes } from './googleConnection';

export function googleEmailActionScopes(
    capability: 'gmail-compose' | 'gmail-send',
) {
    return `${googleReadScopes('gmail')} https://www.googleapis.com/auth/${capability === 'gmail-compose' ? 'gmail.compose' : 'gmail.send'}`;
}
