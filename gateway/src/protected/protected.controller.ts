import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('api/protected')
export class ProtectedController {
  @UseGuards(JwtGuard)
  @Get('ping')
  ping(@Req() req: any) {
    return { ok: true, user: req.user };
  }
}