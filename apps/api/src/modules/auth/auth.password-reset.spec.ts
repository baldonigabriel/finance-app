import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex');

const makeUser = (overrides: Partial<{
  id: string;
  isVerified: boolean;
  passwordResetToken: string | null;
  passwordResetTokenExpiresAt: Date | null;
}> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  whatsappNumber: null,
  isVerified: true,
  verificationCode: null,
  verificationCodeExpiresAt: null,
  passwordResetToken: null,
  passwordResetTokenExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService — password reset', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationCode: jest.fn(),
            sendPasswordResetLink: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    emailService = module.get(EmailService);
  });

  describe('forgotPassword', () => {
    it('sends a reset email when user exists and is verified', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.user.update.mockResolvedValue(makeUser());

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.message).toContain('Se esse e-mail');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordResetToken: expect.any(String),
            passwordResetTokenExpiresAt: expect.any(Date),
          }),
        }),
      );
      expect(emailService.sendPasswordResetLink).toHaveBeenCalledTimes(1);
    });

    it('stores the hashed token, never the raw token', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.user.update.mockResolvedValue(makeUser());

      await service.forgotPassword({ email: 'test@example.com' });

      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      const storedToken: string = updateCall.data.passwordResetToken;
      // A raw 64-char hex token would not equal its own SHA-256 hash
      expect(storedToken).toHaveLength(64);
      const emailCall = (emailService.sendPasswordResetLink as jest.Mock).mock.calls[0];
      const resetUrl: string = emailCall[1];
      const rawToken = new URL(resetUrl).searchParams.get('token')!;
      expect(hashToken(rawToken)).toBe(storedToken);
    });

    it('returns the same generic message when user does not exist (no email enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nobody@example.com' });

      expect(result.message).toContain('Se esse e-mail');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetLink).not.toHaveBeenCalled();
    });

    it('returns the same generic message when user is not verified', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ isVerified: false }));

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.message).toContain('Se esse e-mail');
      expect(emailService.sendPasswordResetLink).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const rawToken = 'a'.repeat(64);

    it('updates the password and clears the reset token', async () => {
      const user = makeUser({
        passwordResetToken: hashToken(rawToken),
        passwordResetTokenExpiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed' as never);

      const result = await service.resetPassword({ token: rawToken, password: 'newPassword123' });

      expect(result.message).toContain('sucesso');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'new-hashed',
            passwordResetToken: null,
            passwordResetTokenExpiresAt: null,
          }),
        }),
      );
    });

    it('throws BadRequestException when token does not match any user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid-token', password: 'newPassword123' }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when token has expired', async () => {
      // Expired token: findFirst returns null because the WHERE clause includes expiry > now
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: rawToken, password: 'newPassword123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('looks up the hashed token in the database, never the raw value', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: rawToken, password: 'newPassword123' }),
      ).rejects.toThrow(BadRequestException);

      const findCall = (prisma.user.findFirst as jest.Mock).mock.calls[0][0];
      expect(findCall.where.passwordResetToken).toBe(hashToken(rawToken));
      expect(findCall.where.passwordResetToken).not.toBe(rawToken);
    });
  });
});
