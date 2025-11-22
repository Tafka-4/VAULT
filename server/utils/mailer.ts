import nodemailer from 'nodemailer';
import { getAppConfig } from './config';

type MailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const cfg = getAppConfig();

const hasGmail = Boolean(cfg.mailGmailUser && cfg.mailGmailAppPassword);

const transporter = hasGmail
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cfg.mailGmailUser,
        pass: cfg.mailGmailAppPassword,
      },
    })
  : null;

export async function sendMail(options: MailOptions) {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.info('[mail] SMTP not configured, printing email instead', options);
    return;
  }

  await transporter.sendMail({
    from: cfg.mailFrom,
    ...options,
  });
}
