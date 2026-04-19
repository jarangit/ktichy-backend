import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppJwtPayload } from '../auth/type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const { email, phoneNumber, password } = createUserDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }

    if (email) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingByEmail) {
        throw new BadRequestException('Email already registered');
      }
    }

    if (phoneNumber) {
      const existingByPhone = await this.userRepository.findOne({
        where: { phoneNumber },
      });
      if (existingByPhone) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email: email ?? null,
      phoneNumber: phoneNumber ?? null,
      passwordHash,
    });
    const savedUser = await this.userRepository.save(user);
    return this.generateToken(savedUser);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  async login(email: string, password: string) {
    // ต้องระบุ select: ["id", "email", "passwordHash"] เพื่อให้ได้ passwordHash มาด้วย
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash'],
    });
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }
    return this.generateToken(user);
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user; // Convert to plain object to exclude passwordHash
  }
  // utils
  private generateToken(user: User) {
    const payload: AppJwtPayload = {
      sub: user.id,
      tokenType: 'user',
      email: user.email ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
    };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'defaultSecret',
      expiresIn: '30d', // Token expiration time
    });
    return {
      access_token: token,
    };
  }
}
