import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

import { RecurringAvailability, RecurringSchema } from './schemas/recurring.schema';
import { DateAvailability, DateSchema } from './schemas/date.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringAvailability.name, schema: RecurringSchema },
      { name: DateAvailability.name, schema: DateSchema },
    ]),
  ],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}