import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreatePairingCodeDto } from './dto/create-pairing-code.dto';
import { UpdatePairingCodeDto } from './dto/update-pairing-code.dto';
import { PairingCodesService } from './pairing-codes.service';

@Controller('pairing-codes')
export class PairingCodesController {
  constructor(private readonly pairingCodesService: PairingCodesService) {}

  @Post()
  create(@Body() createPairingCodeDto: CreatePairingCodeDto) {
    return this.pairingCodesService.create(createPairingCodeDto);
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
  update(@Param('id') id: string, @Body() updatePairingCodeDto: UpdatePairingCodeDto) {
    return this.pairingCodesService.update(id, updatePairingCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pairingCodesService.remove(id);
  }
}
