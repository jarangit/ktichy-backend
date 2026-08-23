import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  TransactionListFilter,
  TransactionsService,
} from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findByStoreId(
    @Query('storeId') storeId: string,
    @Query() filter: TransactionListFilter,
  ) {
    return this.transactionsService.findByStoreId(storeId, filter);
  }

  @Get('counts')
  getCounts(@Query('storeId') storeId: string) {
    return this.transactionsService.getCountsByStoreId(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: Record<string, unknown>) {
    return this.transactionsService.update(id, updateDto);
  }
}
