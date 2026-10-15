export function EmailCapabilityUpgrade() {
    return (
        <details className="rounded-xl border p-4">
            <summary className="cursor-pointer font-medium">
                Enable email drafts and sending
            </summary>
            <p className="my-3 text-sm">
                Google’s draft permission also permits sending. WebWidgets still
                requires a separate approval of each exact message before it
                sends. You will review this additional access at Google; choose
                the same Gmail account.
            </p>
            <a
                href="/api/auth/google/start?capability=gmail-compose&redirect=%2Finbox%2Fcompose"
                className="text-sm text-blue-600 dark:text-blue-400"
            >
                Continue to Google permission review
            </a>
            <hr className="my-4" />
            <p className="my-3 text-sm">
                Outlook requires Mail.ReadWrite for drafts and Mail.Send for
                separately approved sends. Choose the same Outlook account.
            </p>
            <a
                href="/api/auth/microsoft/start?capability=email-actions&redirect=%2Finbox%2Fcompose"
                className="text-sm text-blue-600 dark:text-blue-400"
            >
                Continue to Microsoft permission review
            </a>
        </details>
    );
}
