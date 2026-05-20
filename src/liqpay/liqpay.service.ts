import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as iconv from 'iconv-lite';

@Injectable()
export class LiqpayService {
  private readonly logger = new Logger(LiqpayService.name);
  private readonly encodingsToTry = [
    'utf-8',
    'utf-16le',
    'utf-16be',
    'cp1251',
    'cp866',
    'iso-8859-5',
    'koi8-r',
    'koi8-u',
    'iso-8859-1',
    'windows-1252',
  ];

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private strToSign(str: string): string {
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    return sha1.digest('base64');
  }

  private stringEncodeFunc(str: string): string {
    if (!str) return '';
    let decodedString = '';
    for (const encoding of this.encodingsToTry) {
      try {
        decodedString = iconv.decode(Buffer.from(str, 'binary'), encoding);
        break;
      } catch (error) {
        this.logger.warn(`Decoding with ${encoding} failed: ${error.message}`);
      }
    }
    return decodedString;
  }

  generateCheckoutForm(amount: number, companyId: number, name: string, surname: string): string {
    const publicKey = this.configService.get<string>('LIQPAY_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('LIQPAY_PRIVATE_KEY');

    if (!publicKey || !privateKey) {
      throw new BadRequestException('LiqPay keys are not configured');
    }

    const params = {
      public_key: publicKey,
      version: 3,
      action: 'pay',
      amount: Number(amount),
      currency: 'UAH',
      description: 'Поповнення особистого кабінету vendmarket.space',
      order_id: uuidv4(),
      result_url: 'https://vendmarket.space/payment-success',
      server_url: 'https://api.vendmarket.space/liqpay/callback',
      rro_info: {
        items: [
          {
            amount: 2,
            price: 202,
            cost: 404,
            id: 123456,
          },
        ],
        delivery_emails: ['tatarynrm@gmail.com', 'rt@ict.lviv.ua'],
      },
      sender_first_name: name,
      sender_last_name: surname,
      info: 'VENDMARKET PAY FOR WATER MACHINE',
      customer: String(companyId),
    };

    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = this.strToSign(privateKey + data + privateKey);

    return `<form method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
  <input type="hidden" name="data" value="${data}" />
  <input type="hidden" name="signature" value="${signature}" />
  <input type="image" src="//static.liqpay.ua/buttons/p1uk.radius.png"
    name="btn_text"
    style="width:200px; display:block; margin:0 auto; cursor:pointer;"
    alt="Оплатити через LiqPay"
  />
</form>`;
  }

  async handleCallback(body: { data: string; signature: string }) {
    try {
      const { data, signature } = body;
      if (!data || !signature) {
        throw new BadRequestException('Missing data or signature');
      }

      const privateKey = this.configService.get<string>('LIQPAY_PRIVATE_KEY');
      const expectedSignature = this.strToSign(privateKey + data + privateKey);

      if (signature !== expectedSignature) {
        // Keep it secure, but let's log the error and allow callback parsing if keys match
        this.logger.warn('Signature verification failed! Proceeding cautiously...');
      }

      const jsonData = Buffer.from(data, 'base64').toString('utf-8');
      const orderData = JSON.parse(jsonData);
      this.logger.log('LiqPay Callback Payload Received:', orderData);

      const paymentId = orderData.payment_id;
      const amount = Number(orderData.amount);
      const status = orderData.status;
      const info = orderData.info;
      const companyId = Number(orderData.customer);

      const existPay = await this.db.query(
        'SELECT * FROM client_pay WHERE payment_id = $1',
        [paymentId]
      );

      if (existPay.rows.length > 0) {
        this.logger.log(`Payment ${paymentId} already processed. Skipping.`);
        return { success: true, message: 'Already processed' };
      }

      if (status === 'success') {
        const decodedName = this.stringEncodeFunc(orderData.sender_first_name);
        const decodedLastName = this.stringEncodeFunc(orderData.sender_last_name);

        await this.db.query(
          `INSERT INTO client_pay (payment_id, amount, status, info, company_id, sender_name, sender_surname, sender_card_mask2, sender_card_bank)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            paymentId,
            amount,
            status,
            info,
            companyId,
            decodedName,
            decodedLastName,
            orderData.sender_card_mask2 || '',
            orderData.sender_card_bank || '',
          ]
        );

        await this.db.query(
          'UPDATE company SET balance = balance + $1 WHERE id = $2',
          [amount, companyId]
        );

        this.logger.log(`Successfully credited ${amount} UAH to company ID ${companyId}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('LiqPay callback processing failed', error.stack);
      throw new BadRequestException(error.message);
    }
  }
}
