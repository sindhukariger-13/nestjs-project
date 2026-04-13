import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctor, DoctorSchema } from './doctor.schema';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}