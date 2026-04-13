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
}