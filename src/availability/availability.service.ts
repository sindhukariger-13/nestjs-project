import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RecurringAvailability } from './schemas/recurring.schema';
import { DateAvailability } from './schemas/date.schema';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(RecurringAvailability.name)
    private recurringModel: Model<RecurringAvailability>,

    @InjectModel(DateAvailability.name)
    private dateModel: Model<DateAvailability>,
  ) {}

  // 🔥 Prevent overlapping slots
  isOverlapping(slots: any[]) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (
          slots[i].start < slots[j].end &&
          slots[j].start < slots[i].end
        ) {
          return true;
        }
      }
    }
    return false;
  }

  // 🟢 Set weekly recurring availability
  async setRecurring(body: any) {
    if (this.isOverlapping(body.slots)) {
      throw new BadRequestException('Overlapping slots not allowed');
    }

    return this.recurringModel.findOneAndUpdate(
      { doctorId: body.doctorId, day: body.day },
      body,
      { upsert: true, new: true },
    );
  }

  // 🔵 Set custom date override
  async setDate(body: any) {
    if (this.isOverlapping(body.slots)) {
      throw new BadRequestException('Overlapping slots not allowed');
    }

    return this.dateModel.findOneAndUpdate(
      { doctorId: body.doctorId, date: body.date },
      body,
      { upsert: true, new: true },
    );
  }

  // 🟡 Get availability (MAIN LOGIC)
  async getAvailability(doctorId: string, date: string) {
    // 1️⃣ Check custom override
    const custom = await this.dateModel.findOne({ doctorId, date });

    if (custom) {
      return {
        source: 'custom',
        slots: custom.slots,
      };
    }

    // 2️⃣ Convert date → day
    const day = new Date(date).toLocaleString('en-US', {
      weekday: 'long',
    });

    // 3️⃣ Get recurring
    const recurring = await this.recurringModel.findOne({
      doctorId,
      day,
    });

    return {
      source: 'recurring',
      slots: recurring?.slots || [],
    };
  }
}