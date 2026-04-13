import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Patient } from './patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}

  async createOrUpdate(userId: string, dto: CreatePatientDto) {
    return this.patientModel.findOneAndUpdate(
      { userId },
      { ...dto, userId },
      { new: true, upsert: true },
    );
  }
}