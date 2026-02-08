
import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
        const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

        if (!user || !pass) {
            console.error("Missing email credentials:", { user: !!user, pass: !!pass });
            throw new Error("Missing email credentials (GMAIL_USER/GMAIL_APP_PASSWORD)");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
        });

        // Verify connection before sending (optional but good for debugging)
        // await transporter.verify(); 

        const info = await transporter.sendMail({
            from: `"AFTERM" <${user}>`,
            to,
            subject,
            html,
        });

        console.log("Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("Email send error:", error);
        throw error;
    }
};
