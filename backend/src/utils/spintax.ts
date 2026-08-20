/**
 * Spintax and Template Variable Parser Engine for Cold Outreach
 */

export function parseSpintax(text: string): string {
    if (!text) return '';
    const spintaxRegex = /\{([^{}]+)\}/g;

    let current = text;
    while (spintaxRegex.test(current)) {
        current = current.replace(spintaxRegex, (_, choices) => {
            const options = choices.split('|');
            const randomIndex = Math.floor(Math.random() * options.length);
            return options[randomIndex];
        });
    }

    return current;
}

export function parseMergeTags(
    template: string,
    recipient: { email: string; name?: string | null; company?: string }
): string {
    if (!template) return '';

    const emailUser = recipient.email ? recipient.email.split('@')[0] : 'there';
    const rawName = recipient.name?.trim() || emailUser;
    const firstName = rawName.split(' ')[0] || 'there';

    return template
        .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
        .replace(/\{\{\s*name\s*\}\}/gi, rawName)
        .replace(/\{\{\s*email\s*\}\}/gi, recipient.email)
        .replace(/\{\{\s*company\s*\}\}/gi, recipient.company || 'your company')
        .replace(/\{\{\s*companyName\s*\}\}/gi, recipient.company || 'your company');
}

export function processEmailTemplate(
    template: string,
    recipient: { email: string; name?: string | null; company?: string }
): string {
    const withTags = parseMergeTags(template, recipient);
    return parseSpintax(withTags);
}
