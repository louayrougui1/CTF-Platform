import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendOtpEmail(email: string, code: string, purpose: string) {
    console.log(`[MAIL] To: ${email} | Purpose: ${purpose} | Code: ${code}`);
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: purpose,
      html: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;font-family:Helvetica,Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <tr>
                <td style="padding:32px 40px 0 40px;">
                  <h2 style="margin:0;font-size:20px;color:#1a1a1a;">${purpose}</h2>
                  <p style="margin:12px 0 0 0;font-size:14px;color:#6b7280;line-height:1.5;">
                    Use the code below to continue. This code will expire in 2 minutes.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 40px;">
                  <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;text-align:center;">
                    <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">
                      ${code}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                    If you didn't request this code, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;">
              This is an automated message, please don't reply.
            </p>
          </td>
        </tr>
      </table>
    `,
    });
  }
}
