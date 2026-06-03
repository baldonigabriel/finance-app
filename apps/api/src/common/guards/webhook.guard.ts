import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];
    const expectedKey = this.configService.getOrThrow<string>('EVOLUTION_API_KEY');

    if (!providedKey || typeof providedKey !== 'string') {
      throw new UnauthorizedException('Invalid webhook API key');
    }

    // Timing-safe comparison prevents key enumeration via response time differences
    const provided = Buffer.from(providedKey);
    const expected = Buffer.from(expectedKey);

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid webhook API key');
    }

    return true;
  }
}
