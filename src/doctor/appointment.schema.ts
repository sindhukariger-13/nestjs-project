import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Appointment {
  @Prop()
  doctorId!: string;

  @Prop()
  patientId!: string;

  @Prop()
  date!: string;

  @Prop()
  startTime!: string;

  @Prop()
  endTime!: string;
}

export const AppointmentSchema =
  SchemaFactory.createForClass(Appointment);