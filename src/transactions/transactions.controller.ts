import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findByStoreId(@Query('storeId') storeId: string, @Req() req: any) {
    return this.transactionsService.findByStoreId(storeId, req.user?.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.findOne(id, req.user?.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: any,
  ) {
    return this.transactionsService.update(
      id,
      updateTransactionDto,
      req.user?.sub,
    );
  }
}
