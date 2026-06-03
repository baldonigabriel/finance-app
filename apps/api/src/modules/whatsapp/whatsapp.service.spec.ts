import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '@finance-app/shared';

const mockMessagesCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockMessagesCreate },
  })),
}));

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test',
  password: 'hashed',
  whatsappNumber: '+5511999999999',
  isVerified: true,
  verificationCode: null,
  verificationCodeExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [
    { id: 'cat-1', name: 'Alimentação', icon: 'utensils', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cat-2', name: 'Transporte', icon: 'car', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
  ],
  ...overrides,
});

const makeClaudeResponse = (json: unknown) => ({
  content: [{ type: 'text', text: JSON.stringify(json) }],
});

describe('WhatsappService', () => {
  let service: WhatsappService;
  let prisma: DeepMockProxy<PrismaClient>;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    mockMessagesCreate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
            getSummary: jest.fn().mockResolvedValue({ totalIncome: 3000, totalExpense: 1200, balance: 1800 }),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-api-key') },
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    transactionsService = module.get(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleMessage', () => {
    it('returns null when whatsapp number is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.handleMessage('+5511000000000', 'gastei 50 no mercado');

      expect(result).toBeNull();
      expect(transactionsService.create).not.toHaveBeenCalled();
    });

    it('returns summary when user sends "saldo"', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);

      const result = await service.handleMessage('+5511999999999', 'saldo');

      expect(result?.reply).toContain('Resumo do mês');
      expect(transactionsService.getSummary).toHaveBeenCalledWith('user-1', expect.any(Date));
      expect(transactionsService.create).not.toHaveBeenCalled();
    });

    it('returns summary when user sends "resumo"', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);

      const result = await service.handleMessage('+5511999999999', 'resumo');

      expect(result?.reply).toContain('Resumo do mês');
    });

    it('returns help message when user sends "ajuda"', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);

      const result = await service.handleMessage('+5511999999999', 'ajuda');

      expect(result?.reply).toContain('Finance Bot');
      expect(transactionsService.create).not.toHaveBeenCalled();
    });

    it('records a transaction when Claude returns a valid expense', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);
      mockMessagesCreate.mockResolvedValue(
        makeClaudeResponse({ type: 'expense', amount: 47, category: 'Transporte', description: 'Uber' }),
      );
      (transactionsService.create as jest.Mock).mockResolvedValue({});

      const result = await service.handleMessage('+5511999999999', 'gastei 47 de uber');

      expect(transactionsService.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ type: TransactionType.expense, amount: 47, categoryId: 'cat-2' }),
      );
      expect(result?.reply).toContain('Despesa');
      expect(result?.reply).toContain('Transporte');
    });

    it('records a transaction when Claude returns a valid income', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);
      mockMessagesCreate.mockResolvedValue(
        makeClaudeResponse({ type: 'income', amount: 3000, category: 'Alimentação', description: 'Salário' }),
      );
      (transactionsService.create as jest.Mock).mockResolvedValue({});

      const result = await service.handleMessage('+5511999999999', 'recebi 3000 de salário');

      expect(result?.reply).toContain('Receita');
    });

    it('returns error reply when Claude returns an error response', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);
      mockMessagesCreate.mockResolvedValue(
        makeClaudeResponse({ error: 'Não entendi a mensagem.' }),
      );

      const result = await service.handleMessage('+5511999999999', 'olá tudo bem');

      expect(result?.reply).toBe('Não entendi a mensagem.');
      expect(transactionsService.create).not.toHaveBeenCalled();
    });

    it('returns fallback reply when Claude returns invalid JSON', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'not valid json {{{' }],
      });

      const result = await service.handleMessage('+5511999999999', 'texto aleatório');

      expect(result?.reply).toContain('Erro ao processar');
      expect(transactionsService.create).not.toHaveBeenCalled();
    });

    it('returns fallback reply when Claude returns a transaction with unknown category', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);
      mockMessagesCreate.mockResolvedValue(
        makeClaudeResponse({ type: 'expense', amount: 50, category: 'CategoriaInexistente' }),
      );

      const result = await service.handleMessage('+5511999999999', 'gastei 50 em algo');

      expect(result?.reply).toContain('não encontrada');
      expect(transactionsService.create).not.toHaveBeenCalled();
    });

    it('returns fallback reply when Claude returns an invalid transaction shape', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser() as never);
      mockMessagesCreate.mockResolvedValue(
        makeClaudeResponse({ type: 'invalid', amount: -10 }),
      );

      const result = await service.handleMessage('+5511999999999', 'mensagem estranha');

      expect(result?.reply).toContain('Não consegui identificar');
      expect(transactionsService.create).not.toHaveBeenCalled();
    });
  });
});
