import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// In production, this would be a long, secure key from environment variables
const KEY = crypto.scryptSync(process.env.JWT_SECRET || 'fallback_secret_key_123', 'salt', 32);

/**
 * Encrypts sensitive information (Reversible - "Ida")
 */
export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Format: IV:AUTH_TAG:ENCRYPTED_TEXT
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts sensitive information (Reversible - "Vuelta")
 */
export const decrypt = (hash: string): string => {
    const [ivHex, tagHex, encryptedHex] = hash.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};
