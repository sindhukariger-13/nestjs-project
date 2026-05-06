import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  // ================= CREATE DOCTOR =================
  async createDoctor(data: any) {
    const existing = await this.prisma.doctor.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('Doctor already exists');
    }

    return this.prisma.doctor.create({ data });
  }

  // ================= CREATE SCHEDULE =================
  async createSchedule(dto: CreateScheduleDto) {
    const today = new Date();

    const [sh, sm] = dto.startTime.split(':').map(Number);
    const [eh, em] = dto.endTime.split(':').map(Number);

    const start = new Date(today);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(today);
    end.setHours(eh, em, 0, 0);

    if (start >= end) {
      throw new BadRequestException('Invalid time range');
    }

    return this.createStreamSlots(dto, start, end);
  }

  // ================= STREAM =================
  async createStreamSlots(
    dto: CreateScheduleDto,
    start: Date,
    end: Date,
  ) {
    if (!dto.slotDuration) {
      throw new BadRequestException('slotDuration required');
    }

    let current = new Date(start);

    const slots: any[] = [];

    while (current < end) {
      const slotEnd = new Date(
        current.getTime() + dto.slotDuration * 60000,
      );

      if (slotEnd > end) break;

      slots.push({
        doctorId: 'b81bb348-acbe-4e94-81d2-3c3b84a6f761',
        startTime: new Date(current),
        endTime: slotEnd,
      });

      current = new Date(
        current.getTime() +
          (dto.slotDuration + (dto.bufferTime || 0)) * 60000,
      );
    }

    await this.prisma.slot.createMany({
      data: slots,
    });

    return {
      message: 'Slots created',
      count: slots.length,
    };
  }

  // ================= WAVE =================
  async createWave(dto: CreateScheduleDto, start: Date, end: Date) {
    if (!dto.capacity) {
      throw new BadRequestException('capacity required');
    }

    return this.prisma.wave.create({
      data: {
        doctorId: 'b81bb348-acbe-4e94-81d2-3c3b84a6f761',
        startTime: start,
        endTime: end,
        capacity: dto.capacity,
      },
    });
  }

  // ================= GET AVAILABILITY =================
  async getAvailability(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    const slots = await this.prisma.slot.findMany({
      where: {
        doctorId,
        startTime: { gte: new Date() },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return {
      type: 'STREAM',
      data: slots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        available: !s.isBooked,
      })),
    };
  }

  // ================= SAFE SLOT BOOKING =================
  async bookSlot(slotId: string, patientId: string) {
    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new BadRequestException('Slot not found');
      }

      const doctorId = slot.doctorId;

      const leave = await tx.doctorLeave.findFirst({
        where: {
          doctorId,
          startDate: { lte: slot.startTime },
          endDate: { gte: slot.startTime },
        },
      });

      if (leave) {
        throw new BadRequestException('Doctor on leave');
      }

      const updated = await tx.slot.updateMany({
        where: {
          id: slotId,
          isBooked: false,
        },
        data: {
          isBooked: true,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Slot already booked');
      }

      return tx.appointment.create({
        data: {
          doctorId,
          patientId,
          slotId,
          date: slot.startTime,
        },
      });
    });
  }

  // ================= SAFE WAVE BOOKING =================
  async bookWave(waveId: string, patientId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wave = await tx.wave.findUnique({
        where: { id: waveId },
      });

      if (!wave) {
        throw new BadRequestException('Wave not found');
      }

      const doctorId = wave.doctorId;

      const updated = await tx.wave.updateMany({
        where: {
          id: waveId,
          bookedCount: {
            lt: wave.capacity,
          },
        },
        data: {
          bookedCount: {
            increment: 1,
          },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Wave full');
      }

      return tx.appointment.create({
        data: {
          doctorId,
          patientId,
          waveId,
          date: wave.startTime,
        },
      });
    });
  }

  // ================= AUTO BOOK =================
  async autoBook(doctorId: string, patientId: string) {
    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findFirst({
        where: {
          doctorId,
          isBooked: false,
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      if (!slot) {
        throw new BadRequestException('No slots');
      }

      const leave = await tx.doctorLeave.findFirst({
        where: {
          doctorId,
          startDate: { lte: slot.startTime },
          endDate: { gte: slot.startTime },
        },
      });

      if (leave) {
        throw new BadRequestException('Doctor on leave');
      }

      const updated = await tx.slot.updateMany({
        where: {
          id: slot.id,
          isBooked: false,
        },
        data: {
          isBooked: true,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Slot taken');
      }

      return tx.appointment.create({
        data: {
          doctorId,
          patientId,
          slotId: slot.id,
          date: slot.startTime,
        },
      });
    });
  }

  // ================= APPLY LEAVE =================
  async applyDoctorLeave(
    doctorId: string,
    startDate: Date,
    endDate: Date,
  ) {
    if (startDate > endDate) {
      throw new BadRequestException('Invalid leave range');
    }

    return this.prisma.doctorLeave.create({
      data: {
        doctorId,
        startDate,
        endDate,
      },
    });
  }

  // ================= CANCEL =================
  async cancelAppointment(id: string, patientId: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appt || appt.patientId !== patientId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  // ================= MY APPOINTMENTS =================
  async getMyAppointments(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: {
        date: 'asc',
      },
    });
  }

  // ================= DELETE DOCTOR =================
  async deleteDoctor(id: string) {
    return this.prisma.doctor.delete({
      where: { id },
    });
  }

  // ================= GET DOCTORS =================
  async getDoctors(address?: string, maxFee?: number) {
    return this.prisma.doctor.findMany({
      where: {
        ...(address && {
          address: {
            contains: address,
            mode: 'insensitive',
          },
        }),

        ...(maxFee && {
          consultationFee: {
            lte: maxFee,
          },
        }),
      },
    });
  }

  // ================= GET ADDRESS =================
  async getDoctorAddress(id: string) {
    return this.prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });
  }
}