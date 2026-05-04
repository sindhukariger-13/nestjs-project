import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  // ================= NORMALIZE DATE =================
  private normalizeDate(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // ================= CHECK VALID DAY =================
  async isValidDay(doctorId: string, date: Date): Promise<boolean> {
    const normalized = this.normalizeDate(date);

    // ❌ Sunday
    if (normalized.getDay() === 0) return false;

    // ❌ Doctor Leave
    const leave = await this.prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        startDate: { lte: normalized },
        endDate: { gte: normalized },
      },
    });

    if (leave) return false;

    // ❌ Clinic Holiday
    const holiday = await this.prisma.clinicHoliday.findFirst({
      where: {
        date: normalized,
      },
    });

    if (holiday) return false;

    return true;
  }

  // ================= GET DOCTOR =================
  async getDoctor(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { schedule: true },
    });

    if (!doctor) throw new BadRequestException('Doctor not found');

    return doctor;
  }

  // ================= GENERATE SLOTS =================
  generateSlots(start: string, end: string, duration: number): string[] {
    const slots: string[] = [];

    let [hour, min] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    while (hour < endHour || (hour === endHour && min < endMin)) {
      slots.push(
        `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      );

      min += duration;
      if (min >= 60) {
        hour += Math.floor(min / 60);
        min = min % 60;
      }
    }

    return slots;
  }

  // ================= STREAM BOOKING =================
  async bookStream(patientId: string, doctor: any, date: Date) {
    const schedule = doctor.schedule;

    if (!schedule) {
      throw new BadRequestException('Doctor schedule not set');
    }

    const dayMap = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const today = dayMap[date.getDay()];

    if (!schedule.workingDays.includes(today)) {
      throw new BadRequestException('Doctor not working on this day');
    }

    const slots = this.generateSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration,
    );

    for (const time of slots) {
      const slotDateTime = new Date(date);
      const [h, m] = time.split(':').map(Number);
      slotDateTime.setHours(h, m, 0, 0);

      let slot = await this.prisma.slot.findFirst({
        where: {
          doctorId: doctor.id,
          startTime: slotDateTime,
        },
      });

      if (!slot) {
        const end = new Date(slotDateTime);
        end.setMinutes(end.getMinutes() + schedule.slotDuration);

        slot = await this.prisma.slot.create({
          data: {
            doctorId: doctor.id,
            startTime: slotDateTime,
            endTime: end,
          },
        });
      }

      if (!slot.isBooked) {
        await this.prisma.slot.update({
          where: { id: slot.id },
          data: { isBooked: true },
        });

        return await this.prisma.appointment.create({
          data: {
            doctorId: doctor.id,
            patientId,
            slotId: slot.id,
            date,
          },
        });
      }
    }

    throw new BadRequestException('No slots available');
  }

  // ================= WAVE BOOKING =================
  async bookWave(patientId: string, doctor: any, date: Date) {
    const waves = await this.prisma.wave.findMany({
      where: { doctorId: doctor.id },
    });

    for (const wave of waves) {
      if (wave.bookedCount < wave.capacity) {
        await this.prisma.wave.update({
          where: { id: wave.id },
          data: { bookedCount: { increment: 1 } },
        });

        return await this.prisma.appointment.create({
          data: {
            doctorId: doctor.id,
            patientId,
            waveId: wave.id,
            date,
          },
        });
      }
    }

    throw new BadRequestException('All waves full');
  }

  // ================= MAIN BOOKING =================
  async bookAppointment(patientId: string, doctorId: string, date: Date) {
    const normalized = this.normalizeDate(date);

    const isValid = await this.isValidDay(doctorId, normalized);
    if (!isValid) {
      throw new BadRequestException('Invalid booking date');
    }

    const doctor = await this.getDoctor(doctorId);

    if (doctor.schedulingType === 'STREAM') {
      return this.bookStream(patientId, doctor, normalized);
    }

    return this.bookWave(patientId, doctor, normalized);
  }

  // ================= CANCEL =================
  async cancelAppointment(appointmentId: string, patientId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true, wave: true },
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    if (appointment.patientId !== patientId) {
      throw new BadRequestException('Unauthorized');
    }

    if (appointment.slotId) {
      await this.prisma.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }

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

  // ================= GET APPOINTMENTS =================
  async getMyAppointments(userId: string, role: 'DOCTOR' | 'PATIENT') {
    if (role === 'PATIENT') {
      return this.prisma.appointment.findMany({
        where: { patientId: userId },
      });
    }

    return this.prisma.appointment.findMany({
      where: { doctorId: userId },
    });
  }
}