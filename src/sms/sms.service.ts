import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly KYIVSTAR_API_LINK_SEND_SMS = 'https://api-gateway.kyivstar.ua/rest/v1/sms';

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  // Kyvistar Token Fetch & Cache
  async getKyivstarToken(): Promise<string> {
    const tokenQuery = await this.db.query(
      'SELECT access_token, created_at FROM kyivstar_token ORDER BY id DESC LIMIT 1'
    );

    const now = new Date();
    if (tokenQuery.rows.length > 0) {
      const tokenRow = tokenQuery.rows[0];
      const createdAt = new Date(tokenRow.created_at);
      const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffHours < 6) {
        return tokenRow.access_token;
      }
    }

    // Refresh token
    try {
      const tokenUrl = this.configService.get<string>(
        'KYIVSTAR_TOKEN_URL',
        'https://api-gateway.kyivstar.ua/idp/oauth2/token'
      );
      const clientId = this.configService.get<string>('KYIVSTAR_CLIENT_ID') || '';
      const clientSecret = this.configService.get<string>('KYIVSTAR_CLIENT_SECRET') || '';

      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
        {
          auth: {
            username: clientId,
            password: clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const newToken = response.data.access_token;
      await this.db.query(
        'INSERT INTO kyivstar_token (access_token) VALUES ($1)',
        [newToken]
      );

      return newToken;
    } catch (error) {
      this.logger.error('Failed to retrieve Kyivstar Token', error.stack);
      throw error;
    }
  }

  // Send Generic SMS via Kyivstar API
  async sendKyivstarSms(to: string, text: string, companyId: number, statusId: number, statusName: string) {
    const accessToken = await this.getKyivstarToken();
    if (!accessToken) {
      throw new BadRequestException('Could not get access token');
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      };

      const payload = {
        from: 'VendWater',
        to: to,
        text: text,
      };

      const response = await axios.post(this.KYIVSTAR_API_LINK_SEND_SMS, payload, { headers });

      // Log status in database
      await this.db.query(
        `INSERT INTO sms_status (company_id, status, status_id, status_name)
         VALUES ($1, $2, $3, $4)`,
        [companyId, 'ACCEPTED', statusId, statusName]
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error.stack);
      throw new BadRequestException(error.message);
    }
  }

  // SMS Actions
  async sendMsgAddLitr(body: any) {
    const { data } = body;
    const { smsInfo, liters, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};addlits=${Number(liters)};`;
    
    return this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      1,
      'Видача води'
    );
  }

  async sendRestartModule(body: any) {
    const { data } = body;
    const { smsInfo, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};reboot;`;

    return this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      2,
      'Перезавантаження модуля'
    );
  }

  async sendCollectCash(body: any) {
    const { data } = body;
    const { smsInfo, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};collect;`;

    return this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      3,
      'Collect Cash'
    );
  }

  async sendPriceForLitr(body: any) {
    const { data } = body;
    const { smsInfo, priceForLiter, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};setprice:1=${Number(priceForLiter)};`;

    return this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      4,
      'Зміна ціни'
    );
  }

  async sendGetInfo(body: any) {
    const { data } = body;
    const { smsInfo, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};getinfo;`;

    // Wait, let's fix syntax: Number(smsInfo.machine_pin)
    return this.sendKyivstarSms(
      smsInfo.machine_phone,
      `pin=${Number(smsInfo.machine_pin)};getinfo;`,
      Number(userData.company_id),
      6,
      'Get Info'
    );
  }

  async changePin(body: any) {
    const { data } = body;
    const { smsInfo, pin, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};setpin=${Number(pin)};`;

    const response = await this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      5,
      'Змінити пін'
    );

    // Also update machine pin in DB
    const finalPin = !isNaN(Number(pin)) ? Number(pin) : 1111;
    await this.db.query(
      `UPDATE water_machine SET machine_pin = $1 WHERE machine_id = $2`,
      [finalPin, Number(smsInfo.machine_id)]
    );

    return response;
  }

  async changeNumber(body: any) {
    const { data } = body;
    const { smsInfo, newNumber } = data;
    const result = await this.db.query(
      `UPDATE water_machine SET machine_phone = $1 WHERE machine_id = $2`,
      [Number(newNumber), Number(smsInfo.machine_id)]
    );
    return result;
  }

  async changeToken(body: any) {
    const { data } = body;
    const { smsInfo, newToken, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};settok=${newToken};`;

    const response = await this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      8,
      'Встановити токен'
    );

    await this.db.query(
      `UPDATE water_machine SET machine_token = $1 WHERE machine_id = $2`,
      [newToken, Number(smsInfo.machine_id)]
    );

    return response;
  }

  async changeAddress(body: any) {
    const { data } = body;
    const { smsInfo, newAnthillAddress, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};setantaddr=${newAnthillAddress};`;

    const response = await this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      9,
      'Заміна ADR'
    );

    await this.db.query(
      `UPDATE water_machine SET machine_address = $1 WHERE machine_id = $2`,
      [Number(newAnthillAddress), Number(smsInfo.machine_id)]
    );

    return response;
  }

  async changeServiceNumber(body: any) {
    const { data } = body;
    const { smsInfo, serviceNumber, userData } = data;
    const text = `pin=${Number(smsInfo.machine_pin)};settelnum:1=${serviceNumber};`;

    const response = await this.sendKyivstarSms(
      smsInfo.machine_phone,
      text,
      Number(userData.company_id),
      10,
      'Change Service Number'
    );

    await this.db.query(
      `UPDATE water_machine SET terminal_sim = $1 WHERE machine_id = $2`,
      [serviceNumber, Number(smsInfo.machine_id)]
    );

    return response;
  }

  // SMS Status Retrieval
  async getAllTodaySms() {
    const result = await this.db.query(`
      SELECT *
      FROM sms_status a
      FULL OUTER JOIN company b ON a.company_id = b.id
      FULL OUTER JOIN view_sms_price c ON a.sms_price = c.id
      WHERE DATE(a.created_at) >= current_date
      LIMIT 100
    `);
    return result.rows;
  }

  async getSmsByDate(body: any) {
    const { dateFrom, dateTo } = body;
    if (dateFrom && dateTo) {
      const result = await this.db.query(`
        SELECT *
        FROM sms_status a
        FULL OUTER JOIN company b ON a.company_id = b.id
        FULL OUTER JOIN view_sms_price c ON a.sms_price = c.id
        WHERE DATE(a.created_at) >= $1 AND DATE(a.created_at) <= $2
      `, [dateFrom, dateTo]);
      return result.rows;
    } else {
      throw new BadRequestException({ msg: 'Bad Request!No Date' });
    }
  }

  async getSmsByDateAndCompany(body: any) {
    const { dateFrom, dateTo, company_id } = body;
    if (dateFrom && dateTo) {
      const result = await this.db.query(`
        SELECT *
        FROM sms_status a
        FULL OUTER JOIN company b ON a.company_id = b.id
        FULL OUTER JOIN view_sms_price c ON a.sms_price = c.id
        WHERE DATE(a.created_at) >= $1 AND DATE(a.created_at) <= $2 AND company_id = $3
      `, [dateFrom, dateTo, Number(company_id)]);
      return result.rows;
    } else {
      throw new BadRequestException({ msg: 'Bad Request!No Date' });
    }
  }
}
