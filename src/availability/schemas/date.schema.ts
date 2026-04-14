import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class DateAvailability {
  @Prop({ required: true })
  doctorId!: string;   // ✅ add !

  @Prop({ required: true })
  date!: string;       // ✅ add !

  @Prop({
    type: [{ start: String, end: String }],
  })
  slots!: { start: string; end: string }[];  // ✅ add !
}

export const DateSchema =
  SchemaFactory.createForClass(DateAvailability);