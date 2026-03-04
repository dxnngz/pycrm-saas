/**
 * Utility for sanitizing user inputs.
 * If DOMPurify is ever added to package.json, this file acts as the single point of entry.
 * Currently provides an aggressive but native HTML escaping mechanism for forms.
 */

export const sanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return input;

    // Basic anti-XSS stripping for standard input fields
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Validates a form payload object recursively before submission.
 */
export const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
    const clean: Record<string, unknown> = {};
    for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            const value = payload[key];
            if (typeof value === 'string') {
                clean[key] = sanitizeInput(value);
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                clean[key] = sanitizePayload(value as Record<string, unknown>);
            } else {
                clean[key] = value;
            }
        }
    }
    return clean as T;
};
