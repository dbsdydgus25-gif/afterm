import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getErrorMessage } from "@/lib/error";

export async function POST(req: Request) {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
        const body = await req.json();
        const { email } = body;

        log(`Target Email: ${email}`);
        log(`Checking Env Vars:`);
        const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
        const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

        log(`User: ${user ? 'Set (Length: ' + user.length + ')' : 'MISSING (Checked GMAIL_USER & EMAIL_USER)'}`);
        log(`Pass: ${pass ? 'Set (Length: ' + pass.length + ')' : 'MISSING (Checked GMAIL_APP_PASSWORD & EMAIL_PASS)'}`);

        if (!user || !pass) {
            throw new Error("Missing email credentials env vars");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass,
            },
        });

        log("Transporter created. Verifying connection...");

        try {
            await transporter.verify();
            log("✅ Transporter connection verified!");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (verifyError: any) {
            log(`❌ Verification Failed: ${verifyError.message}`);
            throw verifyError;
        }

        log("Sending mail...");
        const info = await transporter.sendMail({
            from: `"AFTERM Test" <${user}>`,
            to: email,
            subject: "AFTERM Email Test",
            text: "If you are reading this, the email configuration is working correctly.",
            html: "<b>If you are reading this, the email configuration is working correctly.</b>"
        });

        log(`✅ Mail Sent! Message ID: ${info.messageId}`);
        log(`Response: ${info.response}`);

        return NextResponse.json({ success: true, logs });

    } catch (error: unknown) {
        log(`❌ CRITICAL ERROR: ${getErrorMessage(error)}`);
        return NextResponse.json({ success: false, error: getErrorMessage(error), logs }, { status: 500 });
    }
}
