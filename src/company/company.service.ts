import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CompanyService {
  constructor(private readonly db: DatabaseService) {}

  async getAllCompanies() {
    const result = await this.db.query(`SELECT * FROM public.company`);
    return result.rows;
  }

  async createCompany(body: any) {
    const {
      company_name,
      director_name,
      director_surname,
      director_last_surname,
      company_code,
      legal_address,
      phone_number,
    } = body;

    const existing = await this.db.query(
      `SELECT * FROM company WHERE company_code = $1`,
      [company_code],
    );

    if (existing.rows.length > 0) {
      return { message: 'Company already exist' };
    }

    const result = await this.db.query(
      `INSERT INTO company (company_name, director_name, director_surname, director_last_surname, company_code, legal_address, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        company_name,
        director_name,
        director_surname,
        director_last_surname,
        company_code,
        legal_address,
        phone_number,
      ],
    );

    return result.command;
  }

  async editCompany(body: any) {
    const {
      company_name,
      director_name,
      director_surname,
      director_last_surname,
      company_code,
      legal_address,
      phone_number,
      id,
    } = body;

    await this.db.query(
      `UPDATE company 
       SET company_name = $1, director_name = $2, director_surname = $3, director_last_surname = $4,
           company_code = $5, legal_address = $6, phone_number = $7
       WHERE id = $8`,
      [
        company_name,
        director_name,
        director_surname,
        director_last_surname,
        Number(company_code),
        legal_address,
        Number(phone_number),
        Number(id),
      ],
    );

    return { msg: 'Success' };
  }
}
