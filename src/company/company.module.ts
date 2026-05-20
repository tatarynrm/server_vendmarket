import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { ClientController } from './client.controller';
import { CompanyService } from './company.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CompanyController, ClientController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
