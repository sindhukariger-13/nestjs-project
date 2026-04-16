import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  // ✅ CREATE DOCTOR
  async createDoctor(data: any) {
    return this.prisma.doctor.create({
      data: {
        name: data.name,
        email: data.email,
        schedulingType: data.schedulingType,
      },
    });
  }

  // 🧠 MAIN ENTRY
  async createSchedule(dto: CreateScheduleDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

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

  // 🔵 STREAM
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
        startTime: current,
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

  // 🟢 WAVE
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

  // 👤 AVAILABILITY
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

  // 🔵 BOOK SLOT
  async bookSlot(slotId: string) {
    const updated = await this.prisma.slot.updateMany({
      where: { id: slotId, isBooked: false },
      data: { isBooked: true },
    });

    if (updated.count === 0) {
      throw new BadRequestException('Slot already booked or not found');
    }

    return { message: 'Slot booked successfully' };
  }

  // 🟢 BOOK WAVE
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
}