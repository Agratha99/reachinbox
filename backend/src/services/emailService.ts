import nodemailer from 'nodemailer';

let defaultTransporter: nodemailer.Transporter | null = null;
let etherealAccount: nodemailer.TestAccount | null = null;

export async function getDefaultEmailTransporter(): Promise<nodemailer.Transporter> {
    if (defaultTransporter) return defaultTransporter;

    try {
        etherealAccount = await nodemailer.createTestAccount();
        console.log('[EmailService] Created Ethereal SMTP Test Account:', etherealAccount.user);

        defaultTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: etherealAccount.user,
                pass: etherealAccount.pass,
            },
        });

        return defaultTransporter;
    } catch (error) {
        console.error('[EmailService] Ethereal test account generation error, fallback to mock transport:', error);
        defaultTransporter = nodemailer.createTransport({
            jsonTransport: true,
        });
        return defaultTransporter;
    }
}

export interface SendEmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    headers?: Record<string, string>;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    previewUrl?: string;
    error?: string;
}

export async function sendMail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
        let transport: nodemailer.Transporter;

        if (options.smtpHost && options.smtpUser && options.smtpPass) {
            transport = nodemailer.createTransport({
                host: options.smtpHost,
                port: options.smtpPort || 587,
                secure: options.smtpPort === 465,
                auth: {
                    user: options.smtpUser,
                    pass: options.smtpPass,
                },
            });
        } else {
            transport = await getDefaultEmailTransporter();
        }

        const info = await transport.sendMail({
            from: options.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            headers: options.headers,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[EmailService] Email sent to ${options.to}. Ethereal Preview: ${previewUrl}`);
        }

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: previewUrl ? String(previewUrl) : undefined,
        };
    } catch (err: any) {
        console.error(`[EmailService] Failed to dispatch email to ${options.to}:`, err.message);
        return {
            success: false,
            error: err.message || 'SMTP dispatch failed',
        };
    }
}
