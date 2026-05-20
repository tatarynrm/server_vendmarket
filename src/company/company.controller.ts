import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Post('new-client')
  @UseGuards(JwtAuthGuard)
  async createCompany(@Body() body: any) {
    return this.companyService.createCompany(body);
  }

  @Post('edit')
  @UseGuards(JwtAuthGuard)
  async editCompany(@Body() body: any) {
    return this.companyService.editCompany(body);
  }
}
