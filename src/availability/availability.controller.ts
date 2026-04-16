import { Controller, Get, Param } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  // ✅ GET availability by doctorId
  @Get(':doctorId')
  getAvailability(@Param('doctorId') doctorId: string) {
    return this.availabilityService.getAvailability(doctorId);
  }
}