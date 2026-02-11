/**
 * Client-side encryption utilities for Vault feature
 * Uses AES-256 encryption with user's PIN as key
 */

import CryptoJS from 'crypto-js';

/**
 * Encrypt password using AES-256
 * @param plaintext - Plain text password
 * @param pin - User's PIN (used as encryption key)
 * @returns Encrypted string
 */
export function encryptPassword(plaintext: string, pin: string): string {
    if (!plaintext || !pin) {
        throw new Error('Plaintext and PIN are required for encryption');
    }
    return CryptoJS.AES.encrypt(plaintext, pin).toString();
}

/**
 * Decrypt password using AES-256
 * @param ciphertext - Encrypted password
 * @param pin - User's PIN (used as decryption key)
 * @returns Decrypted plain text
 */
export function decryptPassword(ciphertext: string, pin: string): string {
    if (!ciphertext || !pin) {
        throw new Error('Ciphertext and PIN are required for decryption');
    }

    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, pin);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            throw new Error('Invalid PIN or corrupted data');
        }

        return decrypted;
    } catch (_error) {
        throw new Error('Decryption failed. Please check your PIN.');
    }
}

/**
 * Validate PIN format (4-6 digits)
 */
export function validatePin(pin: string): { valid: boolean; message: string } {
    if (!pin) {
        return { valid: false, message: 'PIN을 입력해주세요.' };
    }

    if (!/^\d{4,6}$/.test(pin)) {
        return { valid: false, message: 'PIN은 4-6자리 숫자여야 합니다.' };
    }

    return { valid: true, message: '' };
}
