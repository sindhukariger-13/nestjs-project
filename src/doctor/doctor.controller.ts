import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // ✅ CREATE DOCTOR
  @Post()
  createDoctor(@Body() body: any) {
    return this.doctorService.createDoctor(body);
  }

  // ✅ CREATE SCHEDULE
  @Post('schedule')
  createSchedule(@Body() body: any) {
    return this.doctorService.createSchedule(body);
  }

  // ✅ BOOK SLOT
  @Post('book/slot')
  bookSlot(@Body('slotId') slotId: string) {
    return this.doctorService.bookSlot(slotId);
  }

  // ✅ BOOK WAVE
  @Post('book/wave')
  bookWave(@Body('waveId') waveId: string) {
    return this.doctorService.bookWave(waveId);
  }

  // ✅ GET AVAILABILITY
  @Get('availability/:doctorId')
  getAvailability(@Param('doctorId') doctorId: string) {
    return this.doctorService.getAvailability(doctorId);
  }
}