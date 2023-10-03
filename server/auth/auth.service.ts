import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { DatabaseService } from '../database/database.service';
import { User } from '../@generated/prisma-nestjs-graphql/user/user.model';
import { YubikeyService } from './yubikey.service';
import { YubikeyException } from './yubikey-exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly $jwtService: JwtService,
    // private readonly $database: DatabaseService,
    private readonly $yubikeyService: YubikeyService
  ) {}

  public async validateUser(
    email: string,
    password: string
  ): Promise<any | null> {
    // const user = await this.$database.user.findUnique({
    //   where: {
    //     email
    //   },
    //   select: {
    //     id: true,
    //     email: true,
    //     passwordHash: true,
    //     role: true,
    //     yubikeys: true
    //   }
    // });

    // if (user?.passwordHash) {
    //   const isValidPassword = await argon2.verify(user.passwordHash, password);

    //   if (isValidPassword) {
    //     const { passwordHash, ...result } = user;
    //     return result;
    //   }
    // }

    return null;
  }

  public async login(
    user: User,
    otp: string
  ): Promise<{ accessToken: string }> {
    if (user?.yubikeys && user.yubikeys.length > 0) {
      const clientId = otp.substr(0, 12);

      if (!user.yubikeys.includes(clientId)) {
        throw new HttpException(
          'Invalid Yubikey client supplied',
          HttpStatus.FORBIDDEN
        );
      }

      await this.$yubikeyService.verify(otp);
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role
    };

    return {
      accessToken: this.$jwtService.sign(payload)
    };
  }

  public async registerYubikey(user: User, otp: string): Promise<void> {
    try {
      const clientId = otp.substr(0, 12);

      if (user.yubikeys && user.yubikeys.length > 0) {
        if (user.yubikeys.includes(clientId)) {
          throw new HttpException(
            'Yubikey is already registered',
            HttpStatus.CONFLICT
          );
        }
      }

      const isValid = await this.$yubikeyService.verify(otp);

      if (isValid) {
        const keys =
          user.yubikeys.length > 0
            ? user.yubikeys.push(clientId)
            : Array.from(clientId);

        // user = await this.$database.user.update({
        //   where: {
        //     id: user.id
        //   },
        //   data: {
        //     yubikeys: keys as string[]
        //   }
        // });
      }
    } catch (error: any) {
      throw error;
    }
  }
}
