import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { WebhookGuard } from '../../common/guards/webhook.guard';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WebhookGuard)
  @ApiOperation({ summary: 'Receive Evolution API webhook (requires x-api-key header)' })
  async webhook(@Body() body: Record<string, unknown>) {
    if (body['event'] !== 'messages.upsert') return { received: true };

    const data = body['data'] as Record<string, unknown> | undefined;
    const messageObj = data?.['message'] as Record<string, unknown> | undefined;
    const keyObj = data?.['key'] as Record<string, unknown> | undefined;

    const text =
      (messageObj?.['conversation'] as string | undefined) ||
      ((messageObj?.['extendedTextMessage'] as Record<string, unknown> | undefined)?.['text'] as string | undefined);

    const remoteJid = keyObj?.['remoteJid'] as string | undefined;
    const from = remoteJid?.replace('@s.whatsapp.net', '');

    if (!text || !from) return { received: true };

    try {
      const result = await this.whatsappService.handleMessage(from, text);
      return { received: true, ...(result ?? {}) };
    } catch (err) {
      this.logger.error('Webhook processing error', err);
      return { received: true };
    }
  }
}
