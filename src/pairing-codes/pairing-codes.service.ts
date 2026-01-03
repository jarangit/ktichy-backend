import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid10 } from '../utils/nanoid';
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
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('Pairing code already exists');
    }

    const pairingCode = this.pairingCodeRepository.create({
      id: dto.id ?? `pc_${nanoid10()}`,
      storeId: dto.storeId,
      code: dto.code,
      status: dto.status ?? PairingCodeStatus.PENDING,
      expiresAt: dto.expiresAt,
      createdBy: dto.createdBy,
    });

    return this.pairingCodeRepository.save(pairingCode);
  }

  async findAll(): Promise<PairingCode[]> {
    return this.pairingCodeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<PairingCode> {
    const pairingCode = await this.pairingCodeRepository.findOne({ where: { id } });
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
}
