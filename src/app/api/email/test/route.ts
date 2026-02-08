import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
        const body = await req.json();
        const { email } = body;

        log(`Target Email: ${email}`);
        log(`Checking Env Vars:`);
        log(`EMAIL_USER: ${process.env.EMAIL_USER ? 'Set (Length: ' + process.env.EMAIL_USER.length + ')' : 'MISSING'}`);
        log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'Set (Length: ' + process.env.EMAIL_PASS.length + ')' : 'MISSING'}`);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Missing EMAIL_USER or EMAIL_PASS env vars");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        log("Transporter created. Verifying connection...");

        try {
            await transporter.verify();
            log("✅ Transporter connection verified!");
        } catch (verifyError: any) {
            log(`❌ Verification Failed: ${verifyError.message}`);
            throw verifyError;
        }

        log("Sending mail...");
        const info = await transporter.sendMail({
            from: `"AFTERM Test" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "AFTERM Email Test",
            text: "If you are reading this, the email configuration is working correctly.",
            html: "<b>If you are reading this, the email configuration is working correctly.</b>"
        });

        log(`✅ Mail Sent! Message ID: ${info.messageId}`);
        log(`Response: ${info.response}`);

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        log(`❌ CRITICAL ERROR: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
    }
}
