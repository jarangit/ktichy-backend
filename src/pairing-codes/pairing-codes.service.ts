import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { UpdatePairingCodeDto } from './dto/update-pairing-code.dto';
import { PairingCode, PairingCodeStatus } from './entities/pairing-code.entity';

@Injectable()
export class PairingCodesService {
  constructor(
    @InjectRepository(PairingCode)
    private readonly pairingCodeRepository: Repository<PairingCode>,
  ) {}

  async create(dto: CreatePairingCodeDto): Promise<PairingCode> {
    const existing = await this.pairingCodeRepository.findOne({
      where: { stationId: dto.stationId },
    });

    if (existing) {
      throw new BadRequestException(
        'Pairing code for this station already exists',
      );
    }

    const pairingCode = this.pairingCodeRepository.create({
      storeId: dto.storeId,
      stationId: dto.stationId,
      code: '12345678', //nanoid10(),
      status: dto.status ?? PairingCodeStatus.PENDING,
      expiresAt: dto.expiresAt,
      createdBy: Number(dto.createdBy),
    });

    return this.pairingCodeRepository.save(pairingCode);
  }

  async findAll(): Promise<PairingCode[]> {
    return this.pairingCodeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<PairingCode> {
    const pairingCode = await this.pairingCodeRepository.findOne({
      where: { id },
    });
    if (!pairingCode) {
      throw new NotFoundException(`PairingCode #${id} not found`);
    }
    return pairingCode;
  }

  async update(id: number, dto: UpdatePairingCodeDto): Promise<PairingCode> {
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

  async remove(id: number): Promise<{ message: string }> {
    const pairingCode = await this.findOne(id);
    await this.pairingCodeRepository.remove(pairingCode);
    return { message: `PairingCode #${id} has been removed` };
  }
}
