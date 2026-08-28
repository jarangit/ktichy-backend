import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { GetTransactionCountsQueryDto } from './dto/get-transaction-counts-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findByStoreId(@Query() query: GetTransactionsQueryDto) {
    const { storeId, ...filter } = query;
    return this.transactionsService.findByStoreId(storeId, filter);
  }

  @Get('counts')
  getCounts(@Query() query: GetTransactionCountsQueryDto) {
    const { storeId, ...filter } = query;
    return this.transactionsService.getCountsByStoreId(storeId, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateDto);
  }
}
