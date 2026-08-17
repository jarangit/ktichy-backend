import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppJwtPayload } from '../auth/type';
import { OAuth2Client } from 'google-auth-library';
import { nanoid10 } from '../utils/nanoid';

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
      const existingByEmail = await this.findByEmail(email);
      if (existingByEmail) {
        throw new BadRequestException('Email already registered');
      }
    }

    if (phoneNumber) {
      const existingByPhone = await this.findByPhoneNumber(phoneNumber);
      if (existingByPhone) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email: email ?? null,
      phoneNumber: phoneNumber ?? null,
      username: await this.generateUniqueUsername(email ?? phoneNumber),
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

  /**
   * Google sign-in / sign-up. Verifies the Google ID token (or OAuth access
   * token) from the frontend, then either returns a token for an existing
   * user (matched by verified email) or creates a new user without a password.
   */
  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const payload = await this.verifyGoogleToken(googleLoginDto.idToken);

    const email = payload.email;
    if (!email) {
      throw new BadRequestException('Google account has no email');
    }
    if (String(payload.email_verified) !== 'true') {
      throw new UnauthorizedException('Google email is not verified');
    }

    let user = await this.findByEmail(email);
    if (!user) {
      user = this.userRepository.create({
        email,
        username: await this.generateUniqueUsername(email),
      });
      user = await this.userRepository.save(user);
    }
    return this.generateToken(user);
  }

  // utils
  private async verifyGoogleToken(token: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured');
    }
    try {
      // Primary: verify as a Google ID token (Google Identity Services
      // credential flow — `GoogleLogin`/One Tap returns a JWT credential).
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }
      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      // Fallback: verify as an OAuth access token (legacy implicit flow)
      // via Google's tokeninfo endpoint, checking the audience.
      try {
        const client = new OAuth2Client(clientId);
        const info = await client.getTokenInfo(token);
        const audience = Array.isArray(info.aud) ? info.aud : [info.aud];
        if (!audience.includes(clientId)) {
          throw new UnauthorizedException('Invalid Google token');
        }
        return info;
      } catch (innerErr) {
        if (innerErr instanceof UnauthorizedException) throw innerErr;
        throw new UnauthorizedException('Invalid Google token');
      }
    }
  }

  private async generateUniqueUsername(seed: string | null | undefined) {
    const base = (seed ?? 'user')
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 18);
    const fallback = base || 'user';
    let username = `${fallback}_${nanoid10()}`;
    while (await this.userRepository.findOne({ where: { username } })) {
      username = `${fallback}_${nanoid10()}`;
    }
    return username;
  }

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

  private findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  private findByPhoneNumber(phoneNumber: string) {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }
}
