import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';
import { PairingRequestsService } from './pairing-requests.service';
import { ApprovePairingRequestDto } from './dto/approve-pairing-request.dto';

@Controller('pairing-requests')
export class PairingRequestsController {
  constructor(
    private readonly pairingRequestsService: PairingRequestsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApprovePairingRequestDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    return this.pairingRequestsService.approve(id, userId, dto);
  }
}
