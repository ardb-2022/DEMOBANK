import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  private secretKey = 'Synergic#AM@2025'; // MUST match .NET

  encryptObject(obj: any): string {
    const json = JSON.stringify(obj);
    const encrypted = CryptoJS.AES.encrypt(json, this.secretKey);
    return encrypted.toString();   // Base64 Salted__ format
  }

  decryptToObject(cipherText: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, this.secretKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Empty decrypted string');
      }

      return JSON.parse(decryptedString);
    } catch (err) {
      console.error('Decryption failed:', err);
      return null;
    }
  }
}