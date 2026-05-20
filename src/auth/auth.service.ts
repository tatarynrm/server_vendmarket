import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async login(body: any) {
    const { email, password } = body;
    console.log(email, password);

    const result = await this.db.query(
      `SELECT * FROM public.user WHERE email = $1 AND password = $2`,
      [email, password],
    );
    console.log(result, 'result');

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = await this.jwtService.signAsync(
        { email: user.email },
        {
          secret: this.configService.get<string>('JWT_SECRET', 'vendmarket'),
          expiresIn: '30d',
        },
      );
      return { ...user, token };
    } else {
      throw new BadRequestException({ error: 'Error' });
    }
  }

  async getMe(email: string) {
    const result = await this.db.query(
      `SELECT a.*, b.balance
       FROM public.user AS a
       INNER JOIN company AS b ON a.company_id = b.id
       WHERE a.email = $1;`,
      [email],
    );
    return result.rows[0];
  }
}
