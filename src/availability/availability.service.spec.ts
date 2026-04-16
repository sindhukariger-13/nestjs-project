import { Injectable } from '@nestjs/common';
import { DoctorService } from '../doctor/doctor.service';

@Injectable()
export class AvailabilityService {
  constructor(private doctorService: DoctorService) {}

  async getDoctorAvailability(doctorId: string) {
    return this.doctorService.getAvailability(doctorId);
  }
}