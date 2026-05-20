import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async getAllUsers() {
    const result = await this.db.query(
      `SELECT a.*, b.company_name FROM public.user a LEFT JOIN company b ON a.company_id = b.id`,
    );
    return result.rows;
  }

  async createNewUser(body: any) {
    const { name, surname, last_surname, email, password, tel, company_id } = body;
    const existing = await this.db.query(
      `SELECT * FROM public.user WHERE email = $1`,
      [email],
    );

    if (existing.rows.length > 0) {
      return { message: 'User already exist' };
    }

    const result = await this.db.query(
      `INSERT INTO public.user (name, surname, last_surname, email, password, tel, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, surname, last_surname, email, password, tel, company_id ? Number(company_id) : null],
    );

    return result.command;
  }

  async userUpdate(body: any) {
    const { id, name, surname, last_surname, email, password, tel } = body;
    await this.db.query(
      `UPDATE public.user 
       SET name = $1, surname = $2, last_surname = $3, password = $4, email = $5, tel = $6
       WHERE id = $7`,
      [name, surname, last_surname, password, email, tel, Number(id)],
    );
    return { msg: 'Success' };
  }

  async userDelete(body: any) {
    const { id } = body;
    await this.db.query(`DELETE FROM public.user WHERE id = $1`, [Number(id)]);
    return { msg: 'Success' };
  }

  async cancelActiveFalse(body: any) {
    const { id } = body;
    await this.db.query(
      `UPDATE public.user SET active = $1 WHERE id = $2`,
      [1, Number(id)],
    );
    return { msg: 'success' };
  }
}
