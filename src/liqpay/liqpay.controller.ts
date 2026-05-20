import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { LiqpayService } from './liqpay.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('liqpay')
export class LiqpayController {
  constructor(private readonly liqpayService: LiqpayService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-payment')
  async createPayment(
    @Body() body: { amount: number; company_id: number; name: string; surname: string }
  ) {
    const htmlForm = this.liqpayService.generateCheckoutForm(
      body.amount,
      body.company_id,
      body.name,
      body.surname
    );
    return htmlForm;
  }

  @Post('callback')
  async handleCallback(@Body() body: { data: string; signature: string }) {
    return this.liqpayService.handleCallback(body);
  }
}
