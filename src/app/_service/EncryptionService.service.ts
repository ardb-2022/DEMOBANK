import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  // private key = CryptoJS.enc.Utf8.parse('1203199320052021'); // 16/24/32 chars = 128/192/256-bit
  // private iv  = CryptoJS.enc.Utf8.parse('1203199320052021'); // 16 chars = 128-bit

  private secretKey = 'Synergic#AM@2025'; // MUST match .NET AESPassphrase

encryptData(data: any): string {
  const json = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(json, this.secretKey);
  return encrypted.toString();

  // const json = JSON.stringify(data);
  // const encrypted = CryptoJS.AES.encrypt(json, this.key, {
  //   iv: this.iv,
  //   mode: CryptoJS.mode.CBC,
  //   padding: CryptoJS.pad.Pkcs7
  // });
  // return encrypted.toString(); // Base64
}
encryptObject(obj: any): string {
    const json = JSON.stringify(obj);
    const encrypted = CryptoJS.AES.encrypt(json, this.secretKey);
    return encrypted.toString(); // Base64, starts with U2FsdGVkX1...[web:38][web:17]
  }
 decryptToObject(cipherText: string): any {
    const bytes = CryptoJS.AES.decrypt(cipherText, this.secretKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  }
decryptData(response: any): any {
  if (!response?.data) {
    console.error('Invalid encrypted API response:', response);
    return null;
  }
  const encryptedText = response.data;
  const bytes = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  // const bytes = CryptoJS.AES.decrypt(response.data, this.key, {
  //   iv: this.iv,
  //   mode: CryptoJS.mode.CBC,
  //   padding: CryptoJS.pad.Pkcs7
  // });

  // const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  try {
    return JSON.parse(decryptedString);
  } catch {
    return decryptedString;
  }
}
}
