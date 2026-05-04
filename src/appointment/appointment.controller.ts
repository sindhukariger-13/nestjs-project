import {
  Controller,
  Post,
  Delete,
  Get,
  Query,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // ================= BOOK =================
  @Post('book')
  async book(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @Req() req,
  ) {
    const patientId = req.user.id;

    return this.appointmentService.bookAppointment(
      patientId,
      doctorId,
      new Date(date),
    );
  }

  // ================= CANCEL =================
  @Delete(':id')
  async cancel(@Param('id') id: string, @Req() req) {
    const patientId = req.user.id;

    return this.appointmentService.cancelAppointment(id, patientId);
  }

  // ================= MY APPOINTMENTS =================
  @Get('my')
  async myAppointments(@Req() req) {
    return this.appointmentService.getMyAppointments(
      req.user.id,
      req.user.role,
    );
  }
}