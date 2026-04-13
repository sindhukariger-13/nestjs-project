import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Patient {
  @Prop({ required: true })
  userId!: string;

  @Prop()
  name!: string;

  @Prop()
  age!: number;

  @Prop()
  gender!: string;
}
export const PatientSchema = SchemaFactory.createForClass(Patient);