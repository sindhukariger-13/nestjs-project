import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  getDoctors(
    @Query('name') name?: string,
    @Query('specialization') specialization?: string,
  ) {
    // ⚠️ Handle invalid query values
    if (name && typeof name !== 'string') {
      throw new BadRequestException('Invalid name value');
    }

    if (specialization && typeof specialization !== 'string') {
      throw new BadRequestException('Invalid specialization value');
    }

    return this.doctorService.findDoctors(name, specialization);
  }
}