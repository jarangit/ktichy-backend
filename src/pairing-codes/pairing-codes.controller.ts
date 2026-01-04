import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { UpdatePairingCodeDto } from './dto/update-pairing-code.dto';
import { PairingCodesService } from './pairing-codes.service';
import { JwtAuthGuard } from 'auth/jwt-auth-guard';

@Controller('pairing-codes')
export class PairingCodesController {
  constructor(private readonly pairingCodesService: PairingCodesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPairingCodeDto: CreatePairingCodeDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.pairingCodesService.create({
      ...createPairingCodeDto,
      createdBy: userId,
    });
  }

  @Get()
  findAll() {
    return this.pairingCodesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.pairingCodesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updatePairingCodeDto: UpdatePairingCodeDto,
  ) {
    return this.pairingCodesService.update(id, updatePairingCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.pairingCodesService.remove(id);
  }
}
