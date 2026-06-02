import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WebhookGuard } from '../../common/guards/webhook.guard';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, WebhookGuard],
})
export class WhatsappModule {}
