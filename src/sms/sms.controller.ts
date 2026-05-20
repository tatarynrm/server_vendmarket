import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('msg')
export class MsgController {
  constructor(private readonly smsService: SmsService) { }

  @Post()
  async sendMsgAddLitr(@Body() body: any) {
    return this.smsService.sendMsgAddLitr(body);
  }
  // віів
  @Post('module-restart')
  async sendRestartModule(@Body() body: any) {
    return this.smsService.sendRestartModule(body);
  }

  @Post('collect-cash')
  async sendCollectCash(@Body() body: any) {
    return this.smsService.sendCollectCash(body);
  }

  @Post('set-price')
  async sendPriceForLitr(@Body() body: any) {
    return this.smsService.sendPriceForLitr(body);
  }

  @Post('get-info')
  async sendGetInfo(@Body() body: any) {
    return this.smsService.sendGetInfo(body);
  }

  @Post('change-pin')
  async changePin(@Body() body: any) {
    return this.smsService.changePin(body);
  }

  @Post('change-number')
  async changeNumber(@Body() body: any) {
    return this.smsService.changeNumber(body);
  }

  @Post('change-token')
  async changeToken(@Body() body: any) {
    return this.smsService.changeToken(body);
  }

  @Post('change-address')
  async changeAddress(@Body() body: any) {
    return this.smsService.changeAddress(body);
  }

  @Post('change-service-number')
  async changeServiceNumber(@Body() body: any) {
    return this.smsService.changeServiceNumber(body);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) { }

  @Get()
  async getAllTodaySms() {
    return this.smsService.getAllTodaySms();
  }

  @Post('by-date')
  async getSmsByDate(@Body() body: any) {
    return this.smsService.getSmsByDate(body);
  }

  @Post('by-date-company')
  async getSmsByDateAndCompany(@Body() body: any) {
    return this.smsService.getSmsByDateAndCompany(body);
  }
}
