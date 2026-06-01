import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/dto/create-transaction.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.configService.get('ANTHROPIC_API_KEY') });
  }

  async handleMessage(from: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { whatsappNumber: from },
      include: { categories: true },
    });

    if (!user) {
      this.logger.warn(`Mensagem de número não cadastrado: ${from}`);
      return null;
    }

    const lower = message.toLowerCase().trim();
    if (lower === 'saldo' || lower === 'resumo') return this.handleSummary(user.id);
    if (lower === 'ajuda') return { reply: this.helpMessage() };

    return this.handleTransaction(user.id, message, user.categories);
  }

  private async handleTransaction(
    userId: string,
    message: string,
    categories: Array<{ id: string; name: string }>,
  ) {
    const prompt = `Você é um assistente financeiro. Analise a mensagem do usuário e extraia as informações da transação.

Categorias disponíveis: ${categories.map((c) => c.name).join(', ')}

Mensagem: "${message}"

Responda APENAS com JSON válido, sem markdown:
{
  "type": "income" | "expense",
  "amount": número,
  "category": "nome exato da categoria",
  "description": "descrição curta"
}

Se não for possível identificar uma transação financeira, responda:
{ "error": "Não entendi. Tente: 'gastei 50 no mercado' ou 'recebi 3000 de salário'" }`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') return { reply: 'Erro ao processar mensagem.' };

    let parsed: { type?: string; amount?: number; category?: string; description?: string; error?: string };
    try {
      parsed = JSON.parse(content.text) as typeof parsed;
    } catch {
      return { reply: 'Erro ao processar mensagem. Tente novamente.' };
    }

    if (parsed.error) return { reply: parsed.error };

    const category = categories.find(
      (c) => c.name.toLowerCase() === parsed.category?.toLowerCase(),
    );
    if (!category) return { reply: `Categoria "${parsed.category}" não encontrada.` };

    await this.transactionsService.create(userId, {
      type: parsed.type as TransactionType,
      amount: parsed.amount!,
      categoryId: category.id,
      description: parsed.description,
    });

    const label = parsed.type === 'expense' ? 'Despesa' : 'Receita';
    const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    return { reply: `✅ ${label} de ${brl.format(parsed.amount!)} em ${category.name} registrada!` };
  }

  private async handleSummary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { totalIncome, totalExpense, balance } = await this.transactionsService.getSummary(
      userId,
      startOfMonth,
    );
    const brl = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return {
      reply: `📊 *Resumo do mês:*\n💰 Receitas: ${brl(totalIncome)}\n💸 Despesas: ${brl(totalExpense)}\n📈 Saldo: ${brl(balance)}`,
    };
  }

  private helpMessage() {
    return `🤖 *Finance Bot — Comandos:*\n\n• Registrar gasto: "gastei 50 no mercado"\n• Registrar receita: "recebi 3000 de salário"\n• Ver saldo: "saldo" ou "resumo"`;
  }
}
