import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookSlotDto } from './dto/book-slot.dto';
import { BookWaveDto } from './dto/book-wave.dto';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // ================= CREATE DOCTOR =================
  @UseGuards(AuthGuard('jwt'))
  @Post()
  createDoctor(@Body() body: any) {
    return this.doctorService.createDoctor(body);
  }

  // ================= CREATE SCHEDULE =================
  @UseGuards(AuthGuard('jwt'))
  @Post('schedule')
  createSchedule(@Req() req, @Body() body: any) {
    return this.doctorService.createSchedule({
      ...body,
      doctorId: req.user.id,
    });
  }

  // ================= BOOK SLOT =================
  @UseGuards(AuthGuard('jwt'))
 @Post('book/slot')
bookSlot(@Req() req, @Body() body: BookSlotDto) {
  return this.doctorService.bookSlot(
    body.slotId,
    req.user.id,
  );
}

  // ================= BOOK WAVE =================
  @UseGuards(AuthGuard('jwt'))
 @Post('book/wave')
bookWave(@Req() req, @Body() body: BookWaveDto) {
  return this.doctorService.bookWave(
    body.waveId,
    req.user.id,
  );
}
  // ================= GET AVAILABILITY =================
  @Get('availability/:doctorId')
  getAvailability(@Param('doctorId') doctorId: string) {
    return this.doctorService.getAvailability(doctorId);
  }

  // ================= GET DOCTORS =================
  @Get()
  getDoctors(
    @Query('address') address?: string,
    @Query('maxFee') maxFee?: string,
  ) {
    return this.doctorService.getDoctors(
      address,
      maxFee ? Number(maxFee) : undefined,
    );
  }

  // ================= GET ADDRESS =================
  @Get(':id/address')
  getDoctorAddress(@Param('id') id: string) {
    return this.doctorService.getDoctorAddress(id);
  }

  // ================= APPLY LEAVE =================
  @UseGuards(AuthGuard('jwt'))
  @Post('leave')
  applyLeave(@Req() req, @Body() body: any) {
    return this.doctorService.applyDoctorLeave(
      req.user.id,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  // ================= CANCEL =================
  @UseGuards(AuthGuard('jwt'))
  @Post('cancel')
  cancelAppointment(@Req() req, @Body() body: any) {
    return this.doctorService.cancelAppointment(
      body.appointmentId,
      req.user.id,
    );
  }

  // ================= MY APPOINTMENTS =================
  @UseGuards(AuthGuard('jwt'))
  @Get('appointments')
  getMyAppointments(@Req() req) {
    return this.doctorService.getMyAppointments(req.user.id);
  }

  // ================= DELETE DOCTOR =================
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  deleteDoctor(@Param('id') id: string) {
    return this.doctorService.deleteDoctor(id);
  }
}