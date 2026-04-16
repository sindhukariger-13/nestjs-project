import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async signup(dto: any) {
    return { message: 'Signup working', data: dto };
  }

  async login(dto: any) {
    return { message: 'Login working', data: dto };
  }
}