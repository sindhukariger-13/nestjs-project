import { Injectable } from '@nestjs/common';

@Injectable()
export class PatientService {
  async createOrUpdate(userId: string, dto: any) {
    return {
      message: 'Patient created/updated',
      userId,
      data: dto,
    };
  }
}