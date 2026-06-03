import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  async sendPasswordResetLink(email: string, resetUrl: string, name: string) {
    const from = this.configService.get<string>('EMAIL_FROM') ?? 'Finance App <onboarding@resend.dev>';

    try {
      await this.resend.emails.send({
        from,
        to: email,
        subject: 'Redefinir senha — Finance App',
        html: this.buildResetHtml(resetUrl, name),
      });
      this.logger.log(`Password reset link sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err);
      throw err;
    }
  }

  async sendVerificationCode(email: string, code: string, name: string) {
    const from = this.configService.get<string>('EMAIL_FROM') ?? 'Finance App <onboarding@resend.dev>';

    try {
      await this.resend.emails.send({
        from,
        to: email,
        subject: `${code} é o seu código do Finance App`,
        html: this.buildHtml(code, name),
      });
      this.logger.log(`Verification code sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${email}`, err);
      throw err;
    }
  }

  private buildResetHtml(resetUrl: string, name: string) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #E4E4E7;overflow:hidden;">
        <tr>
          <td style="background:#0C0C0C;padding:20px 32px;">
            <p style="margin:0;color:#fff;font-size:15px;font-weight:600;letter-spacing:-0.3px;">Finance App</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 6px;font-size:14px;color:#71717A;">Olá${name ? `, ${name}` : ''}!</p>
            <p style="margin:0 0 28px;font-size:15px;color:#18181B;line-height:1.65;">
              Recebemos uma solicitação para redefinir a senha da sua conta.<br>
              O link expira em <strong>1 hora</strong>.
            </p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${resetUrl}" style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">Redefinir senha</a>
            </div>
            <p style="margin:0;font-size:13px;color:#A1A1AA;line-height:1.6;">
              Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #F4F4F5;">
            <p style="margin:0;font-size:12px;color:#D4D4D8;">Finance App · Gestão financeira pessoal</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildHtml(code: string, name: string) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #E4E4E7;overflow:hidden;">
        <tr>
          <td style="background:#0C0C0C;padding:20px 32px;">
            <p style="margin:0;color:#fff;font-size:15px;font-weight:600;letter-spacing:-0.3px;">Finance App</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 6px;font-size:14px;color:#71717A;">Olá${name ? `, ${name}` : ''}!</p>
            <p style="margin:0 0 28px;font-size:15px;color:#18181B;line-height:1.65;">
              Use o código abaixo para verificar o seu e-mail.<br>
              Ele expira em <strong>15 minutos</strong>.
            </p>
            <div style="background:#F4F4F5;border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:28px;">
              <p style="margin:0;font-size:44px;font-weight:700;letter-spacing:14px;color:#18181B;font-variant-numeric:tabular-nums;">${code}</p>
            </div>
            <p style="margin:0;font-size:13px;color:#A1A1AA;line-height:1.6;">
              Se você não criou uma conta no Finance App, ignore este e-mail com segurança.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #F4F4F5;">
            <p style="margin:0;font-size:12px;color:#D4D4D8;">Finance App · Gestão financeira pessoal</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
