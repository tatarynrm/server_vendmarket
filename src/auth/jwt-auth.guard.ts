import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization || '';
    const token = authHeader.replace(/Bearer\s?/, '');

    if (!token) {
      throw new ForbiddenException({ message: 'Немає доступу' });
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'vendmarket');
      const decoded = await this.jwtService.verifyAsync(token, { secret });
      request.userId = decoded.email;
      return true;
    } catch (error) {
      throw new ForbiddenException({ message: 'Немає доступу' });
    }
  }
}
