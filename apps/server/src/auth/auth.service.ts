import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register(createAuthDto: unknown) {
    return 'This action adds a new auth';
  }

  login() {
    return `This action returns all auth`;
  }

  refresh(id: number) {
    return `This action returns a #${id} auth`;
  }

  logout(id: number, updateAuthDto: unknown) {
    return `This action updates a #${id} auth`;
  }
}
