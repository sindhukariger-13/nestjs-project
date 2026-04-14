import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from './doctor.schema';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name)
    private doctorModel: Model<Doctor>,

    @InjectModel('Availability')
    private availabilityModel: Model<any>,

    @InjectModel('AvailabilityOverride')
    private overrideModel: Model<any>,

    @InjectModel('Appointment')
    private appointmentModel: Model<any>,
  ) {}

  async findDoctors(name?: string, specialization?: string) {
    const filter: any = {};

    if (name) {
      filter.name = { $regex: name.trim(), $options: 'i' };
    }

    if (specialization) {
      filter.specialization = specialization.trim();
    }

    const doctors = await this.doctorModel.find(filter);

    if (!doctors || doctors.length === 0) {
      return {
        message: 'No doctors found',
        data: [],
      };
    }

    return {
      message: 'Doctors fetched successfully',
      data: doctors,
    };
  }

  async createDoctor(data: any) {
    const doctor = new this.doctorModel(data);
    return doctor.save();
  }

  // ✅ SLOT GENERATION (FINAL FIXED)
  async getAvailableSlots(doctorId: string, date: string) {
    const custom = await this.overrideModel.findOne({ doctorId, date });

    let availability;

    if (custom) {
      if (!custom.isAvailable) return [];
      availability = custom;
    } else {
      const dayOfWeek = new Date(date).getDay();

      availability = await this.availabilityModel.findOne({
        doctorId,
        dayOfWeek,
      });

      if (!availability) return [];
    }

    let slots = generateSlots(
      availability.startTime,
      availability.endTime,
      15
    );

    const now = new Date();

    if (date === now.toISOString().split('T')[0]) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      slots = slots.filter(slot => {
        return convertToMinutes(slot.startTime) > currentMinutes;
      });
    }

    const bookings = await this.appointmentModel.find({ doctorId });

    slots = slots.filter(slot => {
      return !bookings.some((b: any) => {
        const bookingDate = new Date(b.date).toISOString().split('T')[0];

        return (
          b.startTime?.trim() === slot.startTime.trim() &&
          bookingDate === date
        );
      });
    });

    return slots;
  }

  // 🔥 BOOK APPOINTMENT
  async bookAppointment(data: {
    doctorId: string;
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) {
    const { doctorId, date, startTime } = data;

    const existing = await this.appointmentModel.findOne({
      doctorId,
      date,
      startTime,
    });

    if (existing) {
      throw new Error('Slot already booked');
    }

    const appointment = new this.appointmentModel(data);
    return appointment.save();
  }
}

// ✅ HELPERS
function convertToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateSlots(
  startTime: string,
  endTime: string,
  duration: number
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];

  let current = convertToMinutes(startTime);
  const end = convertToMinutes(endTime);

  while (current + duration <= end) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + duration),
    });

    current += duration;
  }

  return slots;
}