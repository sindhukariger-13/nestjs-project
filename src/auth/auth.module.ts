import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'secret123',
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}