import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

const makeUser = (overrides: Partial<{
  id: string;
  email: string;
  isVerified: boolean;
  verificationCode: string | null;
  verificationCodeExpiresAt: Date | null;
}> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  whatsappNumber: null,
  isVerified: true,
  verificationCode: null,
  verificationCodeExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-value') },
        },
        {
          provide: EmailService,
          useValue: { sendVerificationCode: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('creates the user and sends a verification email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(makeUser({ isVerified: false }));
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      });

      expect(result).toEqual(expect.objectContaining({ email: 'test@example.com' }));
      expect(emailService.sendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await expect(
        service.register({ email: 'test@example.com', password: 'password123', name: 'Test' }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    const validCode = '1234';
    const hashedCode = require('crypto').createHash('sha256').update(validCode).digest('hex');

    it('verifies email and returns tokens when code is valid', async () => {
      const user = makeUser({
        isVerified: false,
        verificationCode: hashedCode,
        verificationCodeExpiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, isVerified: true });

      const result = await service.verifyEmail({ email: 'test@example.com', code: validCode });

      expect(result).toEqual(expect.objectContaining({ accessToken: 'signed-token' }));
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isVerified: true, verificationCode: null }),
        }),
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyEmail({ email: 'nobody@example.com', code: validCode }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when email is already verified', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ isVerified: true }));

      await expect(
        service.verifyEmail({ email: 'test@example.com', code: validCode }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when code is incorrect', async () => {
      const user = makeUser({
        isVerified: false,
        verificationCode: hashedCode,
        verificationCodeExpiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.verifyEmail({ email: 'test@example.com', code: 'wrong' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when code has expired', async () => {
      const user = makeUser({
        isVerified: false,
        verificationCode: hashedCode,
        verificationCodeExpiresAt: new Date(Date.now() - 1000), // already expired
      });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.verifyEmail({ email: 'test@example.com', code: validCode }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendCode', () => {
    it('generates a new code and sends a new email', async () => {
      const user = makeUser({ isVerified: false });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.resendCode('test@example.com');

      expect(result).toEqual(expect.objectContaining({ message: expect.any(String) }));
      expect(emailService.sendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.resendCode('nobody@example.com')).rejects.toThrow(NotFoundException);
      expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when email is already verified', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ isVerified: true }));

      await expect(service.resendCode('test@example.com')).rejects.toThrow(BadRequestException);
      expect(emailService.sendVerificationCode).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens when credentials are correct', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual(expect.objectContaining({ accessToken: 'signed-token' }));
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException when email is not verified', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ isVerified: false }));
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
