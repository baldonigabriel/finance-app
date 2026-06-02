import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: 'utensils' },
  { name: 'Transporte', icon: 'car' },
  { name: 'Saúde', icon: 'heart-pulse' },
  { name: 'Lazer', icon: 'gamepad-2' },
  { name: 'Moradia', icon: 'home' },
  { name: 'Educação', icon: 'graduation-cap' },
  { name: 'Outros', icon: 'circle-ellipsis' },
];

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function codeExpiresAt() {
  return new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const code = generateCode();

    await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: await bcrypt.hash(dto.password, 10),
        whatsappNumber: dto.whatsappNumber,
        isVerified: false,
        verificationCode: code,
        verificationCodeExpiresAt: codeExpiresAt(),
        categories: { create: DEFAULT_CATEGORIES },
      },
    });

    await this.emailService.sendVerificationCode(dto.email, code, dto.name);

    return { message: 'Código de verificação enviado para o seu e-mail', email: dto.email };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.isVerified) throw new BadRequestException('E-mail já verificado');
    if (!user.verificationCode || user.verificationCode !== dto.code) {
      throw new BadRequestException('Código inválido');
    }
    if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Código expirado. Solicite um novo.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationCode: null, verificationCodeExpiresAt: null },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { ...tokens, user: { id: user.id, email: user.email, name: user.name } };
  }

  async resendCode(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.isVerified) throw new BadRequestException('E-mail já verificado');

    const code = generateCode();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code, verificationCodeExpiresAt: codeExpiresAt() },
    });

    await this.emailService.sendVerificationCode(email, code, user.name ?? '');

    return { message: 'Novo código enviado' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('E-mail não verificado. Verifique seu e-mail antes de entrar.');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return { ...tokens, user: { id: user.id, email: user.email, name: user.name } };
  }

  async refreshTokens(userId: string, email: string) {
    return this.generateTokens(userId, email);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
