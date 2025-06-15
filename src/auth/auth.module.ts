import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth-guard';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // ต้องตั้งค่าใน .env ด้วย
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtModule],
})
export class AuthModule {}
