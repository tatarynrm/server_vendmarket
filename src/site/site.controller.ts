import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SiteService } from './site.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get()
  async getAllMachinesPrice() {
    return this.siteService.getAllMachinesPrice();
  }

  @Get('contacts')
  async getSiteContacts() {
    return this.siteService.getSiteContacts();
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-machine')
  async changeMachineValues(
    @Body() body: { id: number; price: number; title: string }
  ) {
    return this.siteService.changeMachineValues(body.id, body.title, body.price);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-number')
  async changeNumber(
    @Body() body: { id: number; phone_number: string }
  ) {
    return this.siteService.changeNumber(body.id, body.phone_number);
  }
}
