import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async bookAppointment(dto: any) {
    const { doctorId, patientPhone, patientName, reason } = dto;

    if (!doctorId || !patientPhone) {
      throw new BadRequestException('doctorId and patientPhone are required');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    let date = new Date();

    for (let i = 0; i < 7; i++) {
      if (date.getDay() === 0) {
        date.setDate(date.getDate() + 1);
        continue;
      }

      // STREAM
      if (doctor.schedulingType === 'STREAM') {
        const slots = await this.prisma.slot.findMany({
          where: {
            doctorId,
            isBooked: false,
          },
          orderBy: { startTime: 'asc' },
        });

        const slot = slots[0];

        if (slot) {
          await this.prisma.slot.update({
            where: { id: slot.id },
            data: { isBooked: true },
          });

          return {
            message: 'Appointment booked successfully',
            type: 'STREAM',
            date: slot.startTime,
            startTime: slot.startTime,
            endTime: slot.endTime,
            patientPhone,
            patientName,
            reason,
          };
        }
      }

      // WAVE
      if (doctor.schedulingType === 'WAVE') {
        const waves = await this.prisma.wave.findMany({
          where: { doctorId },
          orderBy: { startTime: 'asc' },
        });

        const wave = waves.find(w => w.bookedCount < w.capacity);

        if (wave) {
          await this.prisma.wave.update({
            where: { id: wave.id },
            data: { bookedCount: { increment: 1 } },
          });

          return {
            message: 'Appointment booked in wave',
            type: 'WAVE',
            date: wave.startTime,
            startTime: wave.startTime,
            endTime: wave.endTime,
            patientPhone,
            patientName,
            reason,
          };
        }
      }

      date.setDate(date.getDate() + 1);
    }

    throw new BadRequestException('No slots available in next 7 days');
  }

  async getAvailableSlots(doctorId: string) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // STREAM
    if (doctor.schedulingType === 'STREAM') {
      const slots = await this.prisma.slot.findMany({
        where: {
          doctorId,
          isBooked: false,
        },
        orderBy: { startTime: 'asc' },
      });

      return {
        type: 'STREAM',
        total: slots.length,
        slots,
      };
    }

    // WAVE
    if (doctor.schedulingType === 'WAVE') {
      const waves = await this.prisma.wave.findMany({
        where: { doctorId },
        orderBy: { startTime: 'asc' },
      });

      const available = waves.filter(w => w.bookedCount < w.capacity);

      return {
        type: 'WAVE',
        total: available.length,
        waves: available,
      };
    }
  }
}