import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from '../entities/restaurant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}
  async create(createRestaurantDto: CreateRestaurantDto) {
    const { userId, name } = createRestaurantDto;
    // 1️⃣ Check ว่ามี Restaurant ของ user นี้อยู่แล้วไหม
    const existing = await this.restaurantRepository.findOne({
      where: { owner_id: userId },
    });
    // if (existing) {
    //   throw new BadRequestException('You already have a restaurant created.');
    // }

    // 2️⃣ ถ้ายังไม่มี → สร้างใหม่
    const restaurant = this.restaurantRepository.create({
      name,
      owner_id: userId,
    });

    return this.restaurantRepository.save(restaurant);
  }

  findAll() {
    return `This action returns all restaurants`;
  }

  async findOne(id: number, userId: number) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id, owner_id: userId },
    });
    if (!restaurant) {
      throw new BadRequestException('Restaurant not found or you are not the owner');
    }
    return restaurant;
  }

  async update(id: number, updateRestaurantDto: UpdateRestaurantDto) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
    });
    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }
    Object.assign(restaurant, updateRestaurantDto);
    return await this.restaurantRepository.save(restaurant);
  }

  remove(id: number) {
    return `This action removes a #${id} restaurant`;
  }

  async findByUserId(userId: number) {
    return this.restaurantRepository.find({ where: { owner: { id: userId } } });
  }
}
