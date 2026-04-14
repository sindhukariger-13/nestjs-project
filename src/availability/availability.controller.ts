import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  // 🟢 Set recurring
  @Post('recurring')
  setRecurring(@Body() body: any) {
    return this.service.setRecurring(body);
  }

  // 🔵 Set custom date
  @Post('date')
  setDate(@Body() body: any) {
    return this.service.setDate(body);
  }

  // 🟡 Get availability
  @Get()
  getAvailability(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.service.getAvailability(doctorId, date);
  }
}