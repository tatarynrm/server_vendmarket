import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      user: this.configService.get<string>('DB_USER', 'postgres'),
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      database: this.configService.get<string>('DB_NAME', 'vendmarket_db'),
      password: this.configService.get<string>('DB_PASSWORD', 'noris'),
      port: this.configService.get<number>('DB_PORT', 5432),
    });

    this.logger.log('PostgreSQL Connection Pool initialized');
  }

  async query(text: string, params?: any[]): Promise<QueryResult<any>> {
    try {
      return await this.pool.query(text, params);
    } catch (error) {
      this.logger.error(`Database query failed: ${text}`, error.stack);
      throw error;
    }
  }

  async connect() {
    return await this.pool.connect();
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL Connection Pool closed');
  }
}
