import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { MachineModule } from './machine/machine.module';
import { SmsModule } from './sms/sms.module';
import { LiqpayModule } from './liqpay/liqpay.module';
import { SiteModule } from './site/site.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // Global Configurations
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),

    // Feature Modules
    DatabaseModule,
    AuthModule,
    UserModule,
    CompanyModule,
    MachineModule,
    SmsModule,
    LiqpayModule,
    SiteModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
