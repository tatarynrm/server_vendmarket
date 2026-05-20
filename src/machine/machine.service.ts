import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MachineService {
  constructor(private readonly db: DatabaseService) {}

  async getMyMachine(body: any) {
    const { company_id } = body;
    const result = await this.db.query(
      `SELECT * FROM water_machine WHERE company_id = $1`,
      [Number(company_id)],
    );
    return result.rows;
  }

  async getAllMachines() {
    const result = await this.db.query(
      `SELECT * FROM water_machine a FULL OUTER JOIN company b ON a.company_id = b.id`,
    );
    return result.rows;
  }

  async getOneMachine(id: string) {
    const result = await this.db.query(
      `SELECT * FROM water_machine a FULL OUTER JOIN company b ON a.company_id = b.id WHERE a.machine_id = $1`,
      [Number(id)],
    );
    return result.rows;
  }

  async createNewMachine(body: any) {
    const {
      machine_id,
      address,
      company_id,
      machine_phone,
      terminal_sim,
      machine_pin,
    } = body;

    const existing = await this.db.query(
      `SELECT * FROM water_machine WHERE machine_id = $1`,
      [Number(machine_id)],
    );

    if (existing.rows.length > 0) {
      return { message: 'User already exist' }; // Keeping exact same message string from original
    }

    const result = await this.db.query(
      `INSERT INTO water_machine (machine_id, address, company_id, machine_phone, terminal_sim, machine_pin)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        Number(machine_id),
        address,
        company_id ? Number(company_id) : null,
        machine_phone ? String(machine_phone) : null,
        terminal_sim ? Number(terminal_sim) : null,
        machine_pin ? Number(machine_pin) : null,
      ],
    );

    return result.command;
  }

  async editMachine(body: any) {
    const {
      machine_id,
      address,
      machine_phone,
      terminal_sim,
      machine_pin,
      company_id,
    } = body;

    if (company_id === undefined) {
      await this.db.query(
        `UPDATE water_machine 
         SET address = $1, machine_phone = $2, terminal_sim = $3, machine_pin = $4
         WHERE machine_id = $5`,
        [
          address,
          machine_phone,
          terminal_sim !== null ? String(terminal_sim) : '0',
          Number(machine_pin),
          Number(machine_id),
        ],
      );
    } else {
      await this.db.query(
        `UPDATE water_machine 
         SET address = $1, machine_phone = $2, terminal_sim = $3, machine_pin = $4, company_id = $5
         WHERE machine_id = $6`,
        [
          address,
          machine_phone,
          terminal_sim !== null ? String(terminal_sim) : '0',
          Number(machine_pin),
          Number(company_id),
          Number(machine_id),
        ],
      );
    }

    return { msg: 'Success' };
  }

  async deleteMachine(body: any) {
    const { id } = body;
    await this.db.query(
      `DELETE FROM water_machine WHERE machine_id = $1`,
      [Number(id)],
    );
    return { msg: 'Success' };
  }

  async changeAddress(body: any) {
    const { id, address } = body;
    await this.db.query(
      `UPDATE water_machine SET address = $1 WHERE id = $2`,
      [address, Number(id)],
    );
    return { msg: 'ok' };
  }

  async machineBalanceUp(body: any) {
    const { company_id, id } = body;
    const result = await this.db.query(
      `SELECT a.balance FROM company a WHERE a.id = $1`,
      [Number(company_id)],
    );

    if (result.rows.length > 0 && result.rows[0].balance >= 100) {
      const res1 = await this.db.query(
        `UPDATE water_machine 
         SET month_balance = 100
         WHERE id = $1
         RETURNING month_balance`,
        [Number(id)],
      );
      return res1.rows[0].month_balance;
    } else {
      return {
        status: 400,
        msg: 'Недостатньо коштів на балансі',
      };
    }
  }

  async blockOrUnblockMachine(body: any) {
    const { machine_id } = body;
    const result = await this.db.query(
      `SELECT * FROM water_machine WHERE machine_id = $1`,
      [Number(machine_id)],
    );

    if (result.rows.length > 0) {
      const balance = result.rows[0].month_balance;
      if (balance >= 100) {
        await this.db.query(
          `UPDATE water_machine SET month_balance = 0 WHERE machine_id = $1`,
          [Number(machine_id)],
        );
        return { balance: 0 };
      } else {
        await this.db.query(
          `UPDATE water_machine SET month_balance = 100 WHERE machine_id = $1`,
          [Number(machine_id)],
        );
        return { balance: 100 };
      }
    }
    return { balance: 0 };
  }
}
