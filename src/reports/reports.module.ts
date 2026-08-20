import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Store } from '../stores/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Store]), JwtModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
