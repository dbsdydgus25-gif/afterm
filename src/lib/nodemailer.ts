
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: `"AFTERM" <${process.env.EMAIL_USER}>`,
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
