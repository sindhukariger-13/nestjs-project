import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Doctor {
  @Prop({ required: true })
  userId!: string;

  @Prop()
  name!: string;

  @Prop()
  specialization!: string;

  @Prop()
  experience!: number;

  @Prop()
  hospital!: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);