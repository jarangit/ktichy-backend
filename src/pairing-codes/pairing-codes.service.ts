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
import {
  PairingRequest,
  PairingRequestStatus,
} from '../pairing-requests/entities/pairing-request.entity';
import { nanoid10 } from '../utils/nanoid';

@Injectable()
export class PairingCodesService {
  constructor(
    @InjectRepository(PairingCode)
    private readonly pairingCodeRepository: Repository<PairingCode>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(PairingRequest)
    private readonly pairingRequestRepository: Repository<PairingRequest>,
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

    const ttlMinutes = dto.ttlMinutes ?? 10;
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
    const pairingCode = await this.pairingCodeRepository.findOne({
      where: { code, status: PairingCodeStatus.PENDING },
    });

    if (!pairingCode) {
      throw new NotFoundException('Pairing code not found');
    }

    if (pairingCode.expiresAt && pairingCode.expiresAt <= new Date()) {
      pairingCode.status = PairingCodeStatus.EXPIRED;
      await this.pairingCodeRepository.save(pairingCode);
      throw new BadRequestException('Pairing code expired');
    }

    let device = await this.deviceRepository.findOne({
      where: { deviceId: dto.deviceId },
    });

    if (!device) {
      device = this.deviceRepository.create({
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        fingerprint: dto.fingerprint,
        appVersion: dto.appVersion,
        alias: dto.alias,
        status: DeviceStatus.PENDING,
        lastSeenAt: new Date(),
      });
      device = await this.deviceRepository.save(device);
    } else {
      device.deviceName = dto.deviceName ?? device.deviceName;
      device.fingerprint = dto.fingerprint ?? device.fingerprint;
      device.appVersion = dto.appVersion ?? device.appVersion;
      device.alias = dto.alias ?? device.alias;
      device.lastSeenAt = new Date();
      if (device.status !== DeviceStatus.PAIRED) {
        device.status = DeviceStatus.PENDING;
      }
      device = await this.deviceRepository.save(device);
    }

    const existingRequest = await this.pairingRequestRepository.findOne({
      where: {
        deviceId: device.id,
        storeId: pairingCode.storeId,
        status: PairingRequestStatus.WAITING_APPROVAL,
      },
      order: { createdAt: 'DESC' },
    });

    if (existingRequest) {
      return {
        pairingRequestId: existingRequest.id,
        status: existingRequest.status,
        expiresAt: existingRequest.expiresAt,
      };
    }

    const request = this.pairingRequestRepository.create({
      pairingCodeId: pairingCode.id,
      storeId: pairingCode.storeId,
      stationId: pairingCode.stationId,
      deviceId: device.id,
      requestedAlias: dto.alias,
      requestedFingerprint: dto.fingerprint,
      requestedAppVersion: dto.appVersion,
      status: PairingRequestStatus.WAITING_APPROVAL,
      expiresAt: pairingCode.expiresAt,
    });

    const createdRequest = await this.pairingRequestRepository.save(request);

    return {
      pairingRequestId: createdRequest.id,
      status: createdRequest.status,
      expiresAt: createdRequest.expiresAt,
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
}
