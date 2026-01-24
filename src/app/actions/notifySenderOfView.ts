'use server';

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Admin Client for secure access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function notifySenderOfView(messageId: string) {
    if (!messageId) return { success: false, error: "Message ID missing" };

    try {
        console.log(`[NotifyView] Starting notification for message: ${messageId}`);

        // 1. Fetch Message to get user_id & recipient info
        const { data: message, error: msgError } = await supabaseAdmin
            .from('messages')
            .select('user_id, content')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            console.error("[NotifyView] Message find error:", msgError);
            return { success: false, error: "Message not found" };
        }

        // 2. Fetch User Email (Sender)
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(message.user_id);

        if (userError || !user || !user.email) {
            console.error("[NotifyView] User fetch error:", userError);
            return { success: false, error: "User not found" };
        }

        const senderEmail = user.email;
        const senderName = user.user_metadata?.full_name || '사용자';

        // 3. Check Email Configuration
        const gmailUser = process.env.GMAIL_USER || 'afterm001@gmail.com'; // Default or Env
        const gmailPass = process.env.GMAIL_APP_PASSWORD;

        if (!gmailPass) {
            console.error("[NotifyView] Missing GMAIL_APP_PASSWORD");
            return { success: false, error: "Server email config missing" };
        }

        // 4. Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });

        /* Email Disabled by User Request
        const mailOptions = { ... };
        await transporter.sendMail(mailOptions);
        console.log(`[NotifyView] Email sent to ${senderEmail}`);
        */
        console.log(`[NotifyView] Notification skipped (Disabled).`);
        return { success: true };

    } catch (err: any) {
        console.error("[NotifyView] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
