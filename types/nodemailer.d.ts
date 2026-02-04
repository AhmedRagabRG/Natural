declare module 'nodemailer' {
  export interface TransportOptions {
    service?: string;
    auth?: {
      user: string;
      pass: string;
    };
    [key: string]: any;
  }

  export interface MailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
    [key: string]: any;
  }

  export interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<any>;
  }

  export function createTransport(options: TransportOptions): Transporter;
}