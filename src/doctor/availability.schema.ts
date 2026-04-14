import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Availability {
  @Prop()
  doctorId!: string;

  @Prop()
  dayOfWeek!: number;

  @Prop()
  startTime!: string;

  @Prop()
  endTime!: string;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);