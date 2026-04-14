import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ✅ Schemas
import { Doctor, DoctorSchema } from './doctor.schema';
import { Availability, AvailabilitySchema } from './availability.schema';
import { AvailabilityOverride, AvailabilityOverrideSchema } from './availabilityOverride.schema';
import { Appointment, AppointmentSchema } from './appointment.schema';

// ✅ Service + Controller
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: Availability.name, schema: AvailabilitySchema },
      { name: AvailabilityOverride.name, schema: AvailabilityOverrideSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}