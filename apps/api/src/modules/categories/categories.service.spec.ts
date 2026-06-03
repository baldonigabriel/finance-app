import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

const makeCategory = (overrides: Partial<{ id: string; name: string; userId: string }> = {}) => ({
  id: 'cat-1',
  name: 'Alimentação',
  icon: 'utensils',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates and returns a new category', async () => {
      const category = makeCategory();
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(category);

      const result = await service.create('user-1', { name: 'Alimentação', icon: 'utensils' });

      expect(result).toEqual(category);
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });

    it('throws ConflictException when category name already exists for the same user', async () => {
      prisma.category.findUnique.mockResolvedValue(makeCategory());

      await expect(service.create('user-1', { name: 'Alimentação' })).rejects.toThrow(ConflictException);
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all categories filtered by userId', async () => {
      const categories = [makeCategory(), makeCategory({ id: 'cat-2', name: 'Transporte' })];
      prisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll('user-1');

      expect(result).toEqual(categories);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the category when it belongs to the requesting user', async () => {
      const category = makeCategory();
      prisma.category.findFirst.mockResolvedValue(category);

      const result = await service.findOne('user-1', 'cat-1');

      expect(result).toEqual(category);
    });

    it('throws NotFoundException when category does not exist', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'cat-999')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when category belongs to another user', async () => {
      // userId is in the WHERE clause — another user's record returns null
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-2', 'cat-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns the category', async () => {
      const existing = makeCategory();
      const updated = makeCategory({ name: 'Comida' });
      prisma.category.findFirst.mockResolvedValue(existing);
      prisma.category.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'cat-1', { name: 'Comida' });

      expect(result).toEqual(updated);
      expect(prisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'cat-1' } }),
      );
    });

    it('throws NotFoundException when category does not exist', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.update('user-1', 'cat-999', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(prisma.category.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the category', async () => {
      const category = makeCategory();
      prisma.category.findFirst.mockResolvedValue(category);
      prisma.category.delete.mockResolvedValue(category);

      await expect(service.remove('user-1', 'cat-1')).resolves.not.toThrow();
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });

    it('throws NotFoundException when category does not exist', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'cat-999')).rejects.toThrow(NotFoundException);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });
  });
});
