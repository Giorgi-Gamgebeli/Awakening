import { Injectable } from '@nestjs/common';
import { env } from '../env';

@Injectable()
export class CryptoService {
  private masterKey: string;

  constructor() {
    this.masterKey = env.MASTER_ENCRYPTION_KEY;
  }

  encrypt(data: string) {}

  decrypt(data: string) {}
}
