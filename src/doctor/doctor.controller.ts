import { Controller, Get, Query, BadRequestException, Post, Body, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  getDoctors(
    @Query('name') name?: string,
    @Query('specialization') specialization?: string,
  ) {
    if (name && typeof name !== 'string') {
      throw new BadRequestException('Invalid name value');
    }

    if (specialization && typeof specialization !== 'string') {
      throw new BadRequestException('Invalid specialization value');
    }

    return this.doctorService.findDoctors(name, specialization);
  }

  @Post()
  createDoctor(@Body() body: any) {
    return this.doctorService.createDoctor(body);
  }
@Post('book')
bookSlot(@Body() body: any) {
  return this.doctorService.bookAppointment(body);
}
  // ✅ ADD THIS ONLY ONCE
  @Get(':doctorId/slots')
  getSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('Date is required');
    }

    return this.doctorService.getAvailableSlots(doctorId, date);
  }
}