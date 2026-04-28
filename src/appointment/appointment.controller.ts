import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  @Post('book')
  book(@Body() dto: any) {
    return this.service.bookAppointment(dto);
  }

  @Get('available')
  getAvailable(@Query('doctorId') doctorId: string) {
    return this.service.getAvailableSlots(doctorId);
  }
}