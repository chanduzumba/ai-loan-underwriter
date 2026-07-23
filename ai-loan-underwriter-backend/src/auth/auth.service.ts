import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// DTOs
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

//Entity
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    private jwtService: JwtService
  ) {}

  async register(
    dto: RegisterDto
  ) {
    const existingUser =
      await this.userRepo.findOne({
        where: {
          email: dto.email,
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        "User already exists"
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.password,
        10
      );

    const user =
      this.userRepo.create({
        ...dto,
        password:
          hashedPassword,
      });

    await this.userRepo.save(
      user
    );

    return {
      message:
        "User registered successfully",
    };
  }

  async login(
    dto: LoginDto
  ) {
    const user =
      await this.userRepo.findOne({
        where: {
          email: dto.email,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        "Invalid Email"
      );
    }

    const isValid =
      await bcrypt.compare(
        dto.password,
        user.password
      );

    if (!isValid) {
      throw new UnauthorizedException(
        "Invalid Password"
      );
    }

    const token =
      this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

    return {
      accessToken:
        token,
    };
  }
}
