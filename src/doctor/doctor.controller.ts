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
bookSlot(@Body() body: any) {
  return this.doctorService.bookSlot(
    body.slotId,
    body.patientId,
    body.doctorId,
  );
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

  // 🔥 NEW: GET ALL DOCTORS
  @Get()
  getDoctors() {
    return this.doctorService.getAllDoctors();
  }
// 🔥 CANCEL APPOINTMENT
@Post('cancel')
cancelAppointment(@Body() body: any) {
  return this.doctorService.cancelAppointment(
    body.appointmentId,
    body.patientId,
  );
}
@Get('appointments/:patientId')
getMyAppointments(@Param('patientId') patientId: string) {
  return this.doctorService.getMyAppointments(patientId);
}
}