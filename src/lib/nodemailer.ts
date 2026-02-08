
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const fromEmail = process.env.GMAIL_USER || process.env.EMAIL_USER;
        const info = await transporter.sendMail({
            from: `"AFTERM" <${fromEmail}>`,
            to,
            subject,
            html,
        });
        return info;
    } catch (error) {
        console.error("Email send error:", error);
        throw error;
    }
};
