export function isDeveloperBackendEnabled() {
    return process.env.WEBWIDGETS_DEV_TOOLS === 'enabled';
}

export function assertDeveloperBackendEnabled() {
    if (!isDeveloperBackendEnabled())
        throw new Error('Developer backend tools are disabled');
}
