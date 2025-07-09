import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderStationItemDto } from './create-order-station-item.dto';

export class UpdateOrderStationItemDto extends PartialType(CreateOrderStationItemDto) {}
