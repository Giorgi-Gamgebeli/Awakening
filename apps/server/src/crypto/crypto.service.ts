import { Injectable } from '@nestjs/common';
import { env } from '../env';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  private masterKey: Buffer;

  constructor() {
    this.masterKey = Buffer.from(env.MASTER_ENCRYPTION_KEY, 'base64');

    if (this.masterKey.length !== 32)
      throw new Error('MASTER_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }

  encrypt(plaintext: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);

    const encryptedData = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encryptedData.toString('base64'),
    ].join('.');
  }

  decrypt(data: string) {
    const [ivText, authTagText, encryptedDataText] = data.split('.');

    if (!ivText || !authTagText || !encryptedDataText)
      throw new Error('Invalid encrypted value.');

    const iv = Buffer.from(ivText, 'base64');
    const authTag = Buffer.from(authTagText, 'base64');
    const encryptedData = Buffer.from(encryptedDataText, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);

    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return plaintext.toString('utf8');
  }
}
