import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {

  @Prop({ required: true })
  name!: string;   // ✅ add !

  @Prop({ required: true, unique: true })
  email!: string;  // ✅ add !

  @Prop({ required: true })
  password!: string;   

  @Prop({ required: true, enum: ['doctor', 'patient'] })
  role!: 'doctor' | 'patient';       
}

export const UserSchema = SchemaFactory.createForClass(User);