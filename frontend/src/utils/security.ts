import DOMPurify from 'dompurify';

/**
 * Recursively traverses objects and arrays to sanitize any string values 
 * preventing XSS attacks right before dispatching data to the backend.
 */
export const sanitizePayload = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
        const sanitized = DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] }); // Strip all HTML tags
        return sanitized.trim();
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizePayload(item));
    }

    if (obj !== null && typeof obj === 'object') {
        const newObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            newObj[key] = sanitizePayload(value);
        }
        return newObj;
    }

    return obj;
};
