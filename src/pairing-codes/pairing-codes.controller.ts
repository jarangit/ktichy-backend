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
import { JoinPairingCodeDto } from './dto/join-pairing-code.dto';
import { UpdatePairingCodeDto } from './dto/update-pairing-code.dto';
import { PairingCodesService } from './pairing-codes.service';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';

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

  @Post(':code/join')
  joinByCode(@Param('code') code: string, @Body() joinDto: JoinPairingCodeDto) {
    return this.pairingCodesService.joinByCode(code, joinDto);
  }

  @Get()
  findAll() {
    return this.pairingCodesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pairingCodesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePairingCodeDto: UpdatePairingCodeDto,
  ) {
    return this.pairingCodesService.update(id, updatePairingCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pairingCodesService.remove(id);
  }
}
