import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class AvailabilityOverride {
  @Prop()
  doctorId!: string;

  @Prop()
  date!: string;

  @Prop()
  startTime!: string;

  @Prop()
  endTime!: string;

  @Prop()
  isAvailable!: boolean;
}

export const AvailabilityOverrideSchema =
  SchemaFactory.createForClass(AvailabilityOverride);