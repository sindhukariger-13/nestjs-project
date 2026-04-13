import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/hospital-db'),
    AuthModule,       // 🔥 THIS IS THE FIX
    DoctorModule,
    PatientModule,
  ],
  controllers: [AppController],
})
export class AppModule {}