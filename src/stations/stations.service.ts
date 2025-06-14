import { Injectable } from '@nestjs/common';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { Station } from '../entities/station.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}
  create(createStationDto: CreateStationDto) {
    const station = this.stationRepository.create(createStationDto);
    return this.stationRepository.save(station);
  }

  findAll() {
    return `This action returns all stations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} station`;
  }

  async update(id: number, updateStationDto: UpdateStationDto) {
    await this.stationRepository.update(id, updateStationDto);
    return this.stationRepository.findOneBy({ id });
  }

  async remove(id: number) {
    await this.stationRepository.delete(id);
    return { message: `Station #${id} has been removed` };
  }

  async findByRestaurantId(restaurantId: number) {
    return this.stationRepository.find({
      where: { restaurant: { id: restaurantId } },
    });
  }
}
