import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SiteService {
  private readonly logger = new Logger(SiteService.name);

  constructor(private readonly db: DatabaseService) {}

  async getAllMachinesPrice() {
    const result = await this.db.query('SELECT * FROM vendwater_site');
    return result.rows;
  }

  async getSiteContacts() {
    const result = await this.db.query('SELECT * FROM vendwater_contacts');
    return result.rows[0] || null;
  }

  async changeMachineValues(id: number, title: string, price: number) {
    await this.db.query(
      'UPDATE vendwater_site SET machine_name = $1, machine_price = $2 WHERE id = $3',
      [title, price, id]
    );
    return { message: 'Record updated successfully' };
  }

  async changeNumber(id: number, phone_number: string) {
    // Keep raw numeric update logic matching the original: update vendwater_contacts set phone_number = phone_number
    await this.db.query(
      'UPDATE vendwater_contacts SET phone_number = $1 WHERE id = $2',
      [phone_number, id]
    );
    return { message: 'Record updated successfully' };
  }
}
