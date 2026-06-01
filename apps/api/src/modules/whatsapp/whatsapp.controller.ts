import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receber webhook da Evolution API' })
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
