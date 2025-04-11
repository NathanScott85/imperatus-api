import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';

class EmailService {
    private transporter: Transporter;

    constructor() {
       this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        }); 
    }

    private loadTemplate(templatePath: string): HandlebarsTemplateDelegate {
        const fullPath = path.resolve(__dirname, '../../emails/templates', templatePath);
        const source = fs.readFileSync(fullPath, 'utf-8');
        return handlebars.compile(source);
    }

    async sendMail({
        to,
        subject,
        context,
        templatePath,
        from = process.env.EMAIL_FROM || '',
    }: {
        to: string;
        subject: string;
        context: Record<string, any>;
        templatePath: string;
        from?: string;
    }) {
        try {
            console.log(`📨 Preparing to send email to ${to} using template ${templatePath}`);
            const template = this.loadTemplate(templatePath);
            const html = template(context);

            const mailOptions = { from, to, subject, html };

            await this.transporter.sendMail(mailOptions);

            return { success: true };
        } catch (error) {
            console.error(`Failed to send email to ${to}`, error);
            return { success: false, error: 'Failed to send email' };
        }
    }
}

export default new EmailService();
