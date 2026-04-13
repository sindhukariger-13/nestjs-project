import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  // ✅ SIGNUP
  async signup(dto: any) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      ...dto,
      password: hashedPassword,
    });

    return user;
  }

  // ✅ LOGIN
  async login(dto: any) {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new Error('Invalid password');

    // 🔥 THIS IS WHAT YOU ASKED
    const payload = {
      userId: user._id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}