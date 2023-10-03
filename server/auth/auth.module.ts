import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { DatabaseService } from '../database/database.service';
import { YubikeyService } from './yubikey.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async ($configService: ConfigService) => ({
        secret: $configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7200s'
        }
      })
    }),
    PassportModule.register({
      session: false
    })
  ],
  controllers: [AuthController],
  providers: [
    // DatabaseService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
    YubikeyService
  ],
  exports: [JwtModule, AuthService]
})
export class AuthModule {}
