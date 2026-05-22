/**
 * Server-only Playwright utility for form filling.
 * Requires `playwright` to be installed and browsers available
 * (`npx playwright install chromium`).
 */

// Key aliases: profile field key → terms that might appear in a form field's
// name / id / label / placeholder / aria-label.
const FIELD_ALIASES: Record<string, string[]> = {
    firstName: [
        'first_name',
        'firstname',
        'first-name',
        'fname',
        'given_name',
        'givenname',
    ],
    lastName: [
        'last_name',
        'lastname',
        'last-name',
        'lname',
        'family_name',
        'familyname',
        'surname',
    ],
    email: ['email', 'e-mail', 'emailaddress', 'email_address'],
    phone: [
        'phone',
        'telephone',
        'tel',
        'mobile',
        'cell',
        'phonenumber',
        'phone_number',
    ],
    company: [
        'company',
        'organization',
        'organisation',
        'employer',
        'business',
    ],
    jobTitle: [
        'job_title',
        'jobtitle',
        'job-title',
        'title',
        'position',
        'role',
    ],
    website: ['website', 'url', 'web', 'homepage', 'site'],
    address: [
        'address',
        'street',
        'street_address',
        'streetaddress',
        'address1',
        'addr',
    ],
    city: ['city', 'town', 'locality'],
    state: ['state', 'province', 'region', 'county'],
    zip: ['zip', 'postal', 'postcode', 'zipcode', 'postal_code'],
    country: ['country', 'nation'],
};

function normalise(s: string): string {
    return s.toLowerCase().replace(/[\s_\-]/g, '');
}

function matchesField(attributeText: string, profileKey: string): boolean {
    const norm = normalise(attributeText);
    const aliases = [profileKey, ...(FIELD_ALIASES[profileKey] ?? [])];
    return aliases.some((alias) => norm.includes(normalise(alias)));
}

export interface FillResult {
    fieldsFilled: Record<string, string>;
    screenshot: string; // base64 PNG
    error?: string;
}

export async function fillForm(
    url: string,
    fields: Record<string, string>,
): Promise<FillResult> {
    // Dynamic import so the module can be imported server-side without failing
    // when playwright isn't installed.
    const { chromium } = await import('playwright');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 15_000,
        });

        // Collect every input/select/textarea with relevant attributes
        const formFields = await page.evaluate(() => {
            const els = Array.from(
                document.querySelectorAll(
                    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=file]), select, textarea',
                ),
            );
            return els.map((el) => {
                const htmlEl = el as HTMLInputElement;
                // Find associated label text
                let labelText = '';
                if (htmlEl.id) {
                    const label = document.querySelector(
                        `label[for="${htmlEl.id}"]`,
                    );
                    labelText = label?.textContent?.trim() ?? '';
                }
                if (!labelText) {
                    const parent = htmlEl.closest('label');
                    if (parent) labelText = parent.textContent?.trim() ?? '';
                }
                return {
                    name: htmlEl.name ?? '',
                    id: htmlEl.id ?? '',
                    placeholder: htmlEl.placeholder ?? '',
                    ariaLabel: htmlEl.getAttribute('aria-label') ?? '',
                    label: labelText,
                    type: htmlEl.type ?? 'text',
                };
            });
        });

        const filled: Record<string, string> = {};

        for (const [profileKey, value] of Object.entries(fields)) {
            if (!value) continue;

            for (const formField of formFields) {
                const candidates = [
                    formField.name,
                    formField.id,
                    formField.placeholder,
                    formField.ariaLabel,
                    formField.label,
                ];
                const matched = candidates.some(
                    (c) => c && matchesField(c, profileKey),
                );
                if (!matched) continue;

                // Build a selector: prefer id, fall back to name, fall back to
                // placeholder for inputs.
                let selector = '';
                if (formField.id) {
                    selector = `#${CSS.escape(formField.id)}`;
                } else if (formField.name) {
                    selector = `[name="${formField.name}"]`;
                } else if (formField.placeholder) {
                    selector = `[placeholder="${formField.placeholder}"]`;
                }
                if (!selector) continue;

                try {
                    const el = page.locator(selector).first();
                    await el.fill(value, { timeout: 2_000 });
                    filled[profileKey] = value;
                } catch {
                    // Field not interactable — skip
                }
                break; // Move to next profile field once matched
            }
        }

        const screenshotBuf = await page.screenshot({ fullPage: false });
        const screenshot = screenshotBuf.toString('base64');

        return { fieldsFilled: filled, screenshot };
    } finally {
        await browser.close();
    }
}
