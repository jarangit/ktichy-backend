import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PairingRequest,
  PairingRequestStatus,
} from './entities/pairing-request.entity';
import { Device, DeviceStatus } from '../devices/entities/device.entity';
import { PairingCodeStatus } from '../pairing-codes/entities/pairing-code.entity';
import { PairingCode } from '../pairing-codes/entities/pairing-code.entity';
import { Station } from '../stations/entities/station.entity';
import { ApprovePairingRequestDto } from './dto/approve-pairing-request.dto';

@Injectable()
export class PairingRequestsService {
  constructor(
    @InjectRepository(PairingRequest)
    private readonly pairingRequestRepository: Repository<PairingRequest>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
    @InjectRepository(PairingCode)
    private readonly pairingCodeRepository: Repository<PairingCode>,
  ) {}

  async approve(
    id: string,
    ownerUserId: string,
    dto: ApprovePairingRequestDto,
  ) {
    const request = await this.pairingRequestRepository.findOne({
      where: { id },
      relations: ['store', 'store.owner', 'device', 'pairingCode'],
    });

    if (!request) {
      throw new NotFoundException(`Pairing request #${id} not found`);
    }

    if (request.status !== PairingRequestStatus.WAITING_APPROVAL) {
      throw new BadRequestException('Pairing request is not waiting approval');
    }

    if (request.store?.owner_id !== ownerUserId) {
      throw new BadRequestException('You are not the owner of this store');
    }

    const stationId =
      dto.stationId ?? dto.kitchenStationId ?? request.stationId;
    if (!stationId) {
      throw new BadRequestException('stationId is required');
    }

    const station = await this.stationRepository.findOne({
      where: { id: stationId },
    });
    if (!station) {
      throw new NotFoundException(`Station #${stationId} not found`);
    }

    if (station.storeId !== request.storeId) {
      throw new BadRequestException('Station does not belong to request store');
    }

    request.device.storeId = request.storeId;
    request.device.stationId = station.id;
    request.device.alias =
      dto.alias ?? request.requestedAlias ?? request.device.alias;
    request.device.status = DeviceStatus.PAIRED;
    request.device.lastSeenAt = new Date();
    request.device.store = request.store;
    request.device.station = station;

    await this.deviceRepository.save(request.device);

    request.status = PairingRequestStatus.APPROVED;
    request.approvedBy = ownerUserId;
    request.approvedAt = new Date();
    request.stationId = station.id;
    request.pairingCode.status = PairingCodeStatus.CLOSED;

    await this.pairingCodeRepository.save(request.pairingCode);
    await this.pairingRequestRepository.save(request);

    return {
      message: 'Device paired successfully',
      device: request.device,
      pairingRequest: request,
    };
  }
}
