import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
  ) {}

  // ================= SIGNUP =================
  async signup(dto: any) {
    return {
      message: 'Signup working',
      data: dto,
    };
  }

  // ================= LOGIN =================
  async login(dto: any) {

    // PATIENT LOGIN
    if (
      dto.email === 'patient@gmail.com' &&
      dto.password === '123456'
    ) {

      const payload = {
        sub: 'patient-1',
        role: 'PATIENT',
      };

      return {
        access_token: this.jwtService.sign(payload),
      };
    }

    // DOCTOR LOGIN
    if (
      dto.email === 'doctor@gmail.com' &&
      dto.password === '123456'
    ) {

      const payload = {
        sub: 'doctor-1',
        role: 'DOCTOR',
      };

      return {
        access_token: this.jwtService.sign(payload),
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}