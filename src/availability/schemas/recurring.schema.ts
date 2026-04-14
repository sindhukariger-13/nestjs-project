import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class RecurringAvailability {
  @Prop({ required: true })
  doctorId!: string;   // ✅ add !

  @Prop({ required: true })
  day!: string;        // ✅ add !

  @Prop({
    type: [{ start: String, end: String }],
  })
  slots!: { start: string; end: string }[];  // ✅ add !
}

export const RecurringSchema =
  SchemaFactory.createForClass(RecurringAvailability);