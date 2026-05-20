import { Controller, Get } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('client')
export class ClientController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }
}
