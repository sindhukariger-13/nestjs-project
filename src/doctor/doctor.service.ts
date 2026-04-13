import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from './doctor.schema';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name)
    private doctorModel: Model<Doctor>,
  ) {}

  async findDoctors(name?: string, specialization?: string) {
    const filter: any = {};

    // 🔍 Search by name (case-insensitive)
    if (name) {
      filter.name = { $regex: name.trim(), $options: 'i' };
    }

    // 🩺 Filter by specialization
    if (specialization) {
      filter.specialization = specialization.trim();
    }

    const doctors = await this.doctorModel.find(filter);

    // ⚠️ Handle empty results gracefully
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
}