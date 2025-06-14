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
    const { restaurantId, name, type } = createStationDto;
    const station = this.stationRepository.create({
      name,
      type: type as 'DRINK' | 'FOOD' | 'OTHER',
      restaurant_id: restaurantId,
    });
    return this.stationRepository.save(station);
  }

  findAll() {
    return `This action returns all stations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} station`;
  }

  update(id: number, updateStationDto: UpdateStationDto) {
    return `This action updates a #${id} station`;
  }

  remove(id: number) {
    return `This action removes a #${id} station`;
  }

  async findByRestaurantId(restaurantId: number) {
    return this.stationRepository.find({
      where: { restaurant: { id: restaurantId } },
    });
  }
}
