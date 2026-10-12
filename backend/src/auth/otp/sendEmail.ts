import { Injectable } from "@nestjs/common";
import { google } from "googleapis";
@Injectable()
export class MailerService {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  private gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  constructor() {
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }
  async sendOtpEmail(
    email: string,
    code: string,
    purpose: string,
  ): Promise<void> {
    const html = ` <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;font-family:Helvetica,Arial,sans-serif;"> <tr> <td align="center"> <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);"> <tr> <td style="padding:32px 40px 0 40px;"> <h2 style="margin:0;font-size:20px;color:#1a1a1a;">${purpose}</h2> <p style="margin:12px 0 0 0;font-size:14px;color:#6b7280;line-height:1.5;"> Use the code below to continue. This code will expire in 2 minutes. </p> </td> </tr> <tr> <td style="padding:24px 40px;"> <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;text-align:center;"> <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;"> ${code} </span> </div> </td> </tr> <tr> <td style="padding:0 40px 32px 40px;"> <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;"> If you didn't request this code, you can safely ignore this email. </p> </td> </tr> </table> <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;"> This is an automated message, please don't reply. </p> </td> </tr> </table> `;
    const message = [
      `From: ${process.env.MAIL_FROM}`,
      `To: ${email}`,
      `Subject: ${purpose}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      html,
    ].join("\r\n");
    const raw = Buffer.from(message).toString("base64url");
    await this.gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
  }
}
