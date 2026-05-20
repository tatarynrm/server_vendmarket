import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly smsService: SmsService,
  ) {}

  // Run on the 1st of every month at 9:00 AM (equivalent to '0 9 1 * *' in original)
  @Cron('0 9 1 * *')
  async handleMonthlyBalanceReset() {
    this.logger.log('Executing monthly machine balance reset...');
    try {
      const result = await this.db.query(
        'UPDATE water_machine SET month_balance = 0'
      );
      this.logger.log(`Successfully reset month_balance for all machines: ${result.rowCount} rows updated`);
    } catch (error) {
      this.logger.error('Failed to reset monthly machine balance', error.stack);
    }
  }

  // Preemptively refresh Kyivstar tokens every 5 hours (access token lasts 6 hours)
  @Cron(CronExpression.EVERY_5_HOURS)
  async handleTokenRefresh() {
    this.logger.log('Executing Kyivstar token refresh cron job...');
    try {
      const token = await this.smsService.getKyivstarToken();
      this.logger.log('Successfully validated/refreshed Kyivstar token');
    } catch (error) {
      this.logger.error('Failed to pre-fetch Kyivstar token', error.stack);
    }
  }
}
