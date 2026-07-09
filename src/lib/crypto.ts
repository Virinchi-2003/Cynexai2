import CryptoJS from 'crypto-js';

// For a demo/frontend ERP, we use a static key. In a real app, this should be in an environment variable
// and encryption/decryption should happen on the backend.
const SECRET_KEY = import.meta.env.VITE_APP_SECRET;

if (!SECRET_KEY) {
  throw new Error("FATAL: VITE_APP_SECRET is not defined. Password encryption is insecure.");
}

export const encryptPassword = (password: string): string => {
  if (!password) return '';
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

export const decryptPassword = (encryptedPassword: string): string => {
  if (!encryptedPassword) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed', error);
    return '';
  }
};
