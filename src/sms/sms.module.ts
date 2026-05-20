import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { MsgController, SmsController } from './sms.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [MsgController, SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
