import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { JoinPairingCodeDto } from './dto/join-pairing-code.dto';
import { UpdatePairingCodeDto } from './dto/update-pairing-code.dto';
import { PairingCode, PairingCodeStatus } from './entities/pairing-code.entity';
import { Device, DeviceStatus } from '../devices/entities/device.entity';
import { nanoid10 } from '../utils/nanoid';

import { JwtService } from '@nestjs/jwt';
import { PairingRequest } from '../pairing-requests/entities/pairing-request.entity';

@Injectable()
export class PairingCodesService {
  constructor(
    @InjectRepository(PairingCode)
    private readonly pairingCodeRepository: Repository<PairingCode>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly jwtService: JwtService,
  ) {}

  async create(dto: CreatePairingCodeDto): Promise<any> {
    const storeId = dto.storeId ?? dto.restaurantId;
    if (!storeId) {
      throw new BadRequestException('storeId or restaurantId is required');
    }

    const now = new Date();

    const query = this.pairingCodeRepository
      .createQueryBuilder('pairingCode')
      .where('pairingCode.storeId = :storeId', { storeId })
      .andWhere('pairingCode.status = :status', {
        status: PairingCodeStatus.PENDING,
      })
      .andWhere(
        '(pairingCode.expiresAt IS NULL OR pairingCode.expiresAt > :now)',
        {
          now,
        },
      )
      .orderBy('pairingCode.createdAt', 'DESC');

    if (dto.stationId) {
      query.andWhere('pairingCode.stationId = :stationId', {
        stationId: dto.stationId,
      });
    }

    const existing = await query.getOne();
    if (existing) {
      return {
        ...existing,
        reused: true,
      };
    }

    const ttlMinutes = dto.ttlMinutes ?? 100;
    const expiresAt =
      dto.expiresAt ?? new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const pairingCode = this.pairingCodeRepository.create({
      storeId,
      stationId: dto.stationId,
      code: await this.generateUniqueCode(),
      status: dto.status ?? PairingCodeStatus.PENDING,
      expiresAt,
      createdBy: dto.createdBy,
    });

    const created = await this.pairingCodeRepository.save(pairingCode);
    return {
      ...created,
      reused: false,
    };
  }

  async joinByCode(code: string, dto: JoinPairingCodeDto) {
    const pairingCode = await this.findPendingPairingCode(code);

    await this.ensurePairingCodeNotExpired(pairingCode);
    const device = await this.createPendingDevice(pairingCode, dto);

    return {
      access_token: this.generateToken(device),
    };
  }

  async findAll(): Promise<PairingCode[]> {
    return this.pairingCodeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<PairingCode> {
    const pairingCode = await this.pairingCodeRepository.findOne({
      where: { id },
    });
    if (!pairingCode) {
      throw new NotFoundException(`PairingCode #${id} not found`);
    }
    return pairingCode;
  }

  async update(id: string, dto: UpdatePairingCodeDto): Promise<PairingCode> {
    const pairingCode = await this.findOne(id);

    if (dto.code && dto.code !== pairingCode.code) {
      const existing = await this.pairingCodeRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException('Pairing code already exists');
      }
    }

    Object.assign(pairingCode, dto);
    return this.pairingCodeRepository.save(pairingCode);
  }

  async remove(id: string): Promise<{ message: string }> {
    const pairingCode = await this.findOne(id);
    await this.pairingCodeRepository.remove(pairingCode);
    return { message: `PairingCode #${id} has been removed` };
  }

  // #region Private Methods
  private async generateUniqueCode(): Promise<string> {
    let code = '';
    let exists = true;

    while (exists) {
      code = nanoid10().toUpperCase().slice(0, 8);
      const existing = await this.pairingCodeRepository.findOne({
        where: { code },
      });
      exists = !!existing;
    }

    return code;
  }

  private async findPendingPairingCode(code: string): Promise<PairingCode> {
    const pairingCode = await this.pairingCodeRepository.findOne({
      where: { code, status: PairingCodeStatus.PENDING },
    });

    if (!pairingCode) {
      throw new NotFoundException('Pairing code not found');
    }

    return pairingCode;
  }

  private async ensurePairingCodeNotExpired(
    pairingCode: PairingCode,
  ): Promise<void> {
    const isExpired =
      pairingCode.expiresAt && pairingCode.expiresAt <= new Date();

    if (!isExpired) {
      return;
    }

    pairingCode.status = PairingCodeStatus.EXPIRED;
    await this.pairingCodeRepository.save(pairingCode);
    throw new BadRequestException('Pairing code expired');
  }

  private async createPendingDevice(
    pairingCode: PairingCode,
    dto: JoinPairingCodeDto,
  ): Promise<Device> {
    const device = this.deviceRepository.create({
      ...dto,
      deviceId: `dev_${nanoid10()}`,
      storeId: pairingCode.storeId,
      stationId: pairingCode.stationId,
      status: DeviceStatus.PAIRED,
      lastSeenAt: new Date(),
    });

    return this.deviceRepository.save(device);
  }

  private generateToken(device: Device) {
    const payload = {
      sub: device.id,
      station: device.stationId,
      store: device.storeId,
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
