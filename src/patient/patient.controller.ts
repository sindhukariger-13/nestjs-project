import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('patient')
@Controller('patient')
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Post('onboarding')
  createOrUpdate(@Req() req, @Body() dto: CreatePatientDto) {
    return this.patientService.createOrUpdate(req.user.userId, dto);
  }
}