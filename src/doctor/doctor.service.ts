import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  // ================= CREATE DOCTOR =================
  async createDoctor(data: {
    name: string;
    email: string;
    schedulingType: 'STREAM' | 'WAVE';
  }) {
    const existing = await this.prisma.doctor.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('Doctor already exists');
    }

    return this.prisma.doctor.create({
      data,
    });
  }

  // ================= CREATE SCHEDULE =================
  async createSchedule(dto: CreateScheduleDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    // ✅ FIX TIME CONVERSION
    const today = new Date();

    const [startHour, startMin] = dto.startTime.split(':').map(Number);
    const [endHour, endMin] = dto.endTime.split(':').map(Number);

    const start = new Date(today);
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date(today);
    end.setHours(endHour, endMin, 0, 0);

    if (start >= end) {
      throw new BadRequestException('Invalid time range');
    }

    // 🔴 Conflict check
    const slotConflict = await this.prisma.slot.findFirst({
      where: {
        doctorId: dto.doctorId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    const waveConflict = await this.prisma.wave.findFirst({
      where: {
        doctorId: dto.doctorId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (slotConflict || waveConflict) {
      throw new BadRequestException('Schedule conflict exists');
    }

    if (doctor.schedulingType === 'STREAM') {
      return this.createStreamSlots(dto, start, end);
    } else {
      return this.createWave(dto, start, end);
    }
  }

  // ================= STREAM SLOTS =================
  async createStreamSlots(dto: CreateScheduleDto, start: Date, end: Date) {
    const duration = dto.slotDuration;
    const buffer = dto.bufferTime || 0;

    if (!duration || duration <= 0) {
      throw new BadRequestException('Invalid slot duration');
    }

    let current = new Date(start);
    const slotData: any[] = [];

    while (current.getTime() + duration * 60000 <= end.getTime()) {
      const slotEnd = new Date(current.getTime() + duration * 60000);

      slotData.push({
        doctorId: dto.doctorId,
        startTime: new Date(current),
        endTime: slotEnd,
      });

      current = new Date(
        current.getTime() + (duration + buffer) * 60000,
      );
    }

    await this.prisma.slot.createMany({ data: slotData });

    return {
      message: 'Slots created successfully',
      count: slotData.length,
    };
  }

  // ================= WAVE =================
  async createWave(dto: CreateScheduleDto, start: Date, end: Date) {
    if (!dto.capacity || dto.capacity <= 0) {
      throw new BadRequestException('Invalid capacity');
    }

    return this.prisma.wave.create({
      data: {
        doctorId: dto.doctorId,
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

    if (doctor.schedulingType === 'STREAM') {
      const slots = await this.prisma.slot.findMany({
        where: { doctorId },
        orderBy: { startTime: 'asc' },
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
    } else {
      const waves = await this.prisma.wave.findMany({
        where: { doctorId },
        orderBy: { startTime: 'asc' },
      });

      return {
        type: 'WAVE',
        data: waves.map((w) => ({
          id: w.id,
          startTime: w.startTime,
          endTime: w.endTime,
          availableSpots: w.capacity - w.bookedCount,
        })),
      };
    }
  }

  // ================= BOOK SLOT =================
  async bookSlot(slotId: string, patientId: string, doctorId: string) {
  const slot = await this.prisma.slot.findUnique({
    where: { id: slotId },
  });

  if (!slot || slot.isBooked) {
    throw new BadRequestException('Slot already booked or not found');
  }

  // mark slot booked
  await this.prisma.slot.update({
    where: { id: slotId },
    data: { isBooked: true },
  });

  // create appointment
  return this.prisma.appointment.create({
    data: {
      doctorId,
      patientId,
      slotId,
      date: new Date(),
    },
  });
  }
  // ================= BOOK WAVE =================
  async bookWave(waveId: string) {
    const wave = await this.prisma.wave.findUnique({
      where: { id: waveId },
    });

    if (!wave) {
      throw new BadRequestException('Wave not found');
    }

    if (wave.bookedCount >= wave.capacity) {
      throw new BadRequestException('Wave is full');
    }

    await this.prisma.wave.update({
      where: { id: waveId },
      data: { bookedCount: { increment: 1 } },
    });

    return { message: 'Wave booked successfully' };
  }

// ================= GET ALL DOCTORS =================
async getAllDoctors() {
  return this.prisma.doctor.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      schedulingType: true,
    },
  });
}
// ================= CANCEL APPOINTMENT =================
async cancelAppointment(appointmentId: string, patientId: string) {
  const appointment = await this.prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new BadRequestException('Appointment not found');
  }

  if (appointment.patientId !== patientId) {
    throw new BadRequestException('Unauthorized');
  }

  // 🔓 Free slot if STREAM
  if (appointment.slotId) {
    await this.prisma.slot.update({
      where: { id: appointment.slotId },
      data: { isBooked: false },
    });
  }

  // 🔻 Reduce count if WAVE
  if (appointment.waveId) {
    await this.prisma.wave.update({
      where: { id: appointment.waveId },
      data: { bookedCount: { decrement: 1 } },
    });
  }

  return this.prisma.appointment.delete({
    where: { id: appointmentId },
  });
}
// ================= GET MY APPOINTMENTS =================
async getMyAppointments(patientId: string) {
  return this.prisma.appointment.findMany({
    where: { patientId },
    include: {
      doctor: true,
      slot: true,
      wave: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
}