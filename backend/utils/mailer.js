const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

function formatError(error) {
    return {
        code: error?.code || null,
        command: error?.command || null,
        response: error?.response || null,
        responseCode: error?.responseCode || null,
        message: error?.message || null,
    };
}

// ── Transporter management ────────────────────────────────────────────────────
// We lazy-create the transporter and reset it on auth failure so that if ECS
// restarts with corrected Secrets Manager credentials, the next send attempt
// automatically picks up the new values.
let _transporter = null;
let _transporterUser = null; // track which user the transporter was built for

function getTransporter() {
    const emailUser = process.env.EMAIL_USER || '';
    const emailPass = process.env.EMAIL_PASS || '';

    // Rebuild if env vars changed or transporter was never created
    if (!_transporter || _transporterUser !== emailUser) {
        console.log('[mailer] Creating transporter', {
            emailUser,
            emailPassPresent: Boolean(emailPass),
            emailPassLength: emailPass.length,
            smtpHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
            smtpPort: Number(process.env.EMAIL_PORT || 587),
        });

        _transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT || 587),
            secure: false,
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass },
        });
        _transporterUser = emailUser;
    }
    return _transporter;
}

function resetTransporter() {
    _transporter = null;
    _transporterUser = null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function checkConfig() {
    const missing = [];
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
    if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS');
    if (missing.length > 0) {
        console.error(`[mailer] Missing env vars: ${missing.join(', ')}. Email sending will fail.`);
        return false;
    }
    return true;
}

// ── sendOTP ───────────────────────────────────────────────────────────────────
async function sendOTP(to, code) {
    if (!checkConfig()) return false;
    try {
        const senderEmail = process.env.EMAIL_USER;
        const info = await getTransporter().sendMail({
            from: `"Kaarkun" <${senderEmail}>`,
            to,
            subject: 'Your Verification Code – Kaarkun',
            text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
                <h2 style="color:#4f46e5;margin-bottom:8px;">Email Verification</h2>
                <p style="color:#374151;font-size:15px;">Use the code below to verify your Kaarkun account. It expires in <strong>10 minutes</strong>.</p>
                <div style="text-align:center;margin:28px 0;">
                  <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#111827;">${code}</span>
                </div>
                <p style="color:#6b7280;font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
              </div>`,
        });
        console.log('[mailer] OTP email sent', { to, messageId: info.messageId });
        return true;
    } catch (error) {
        console.error('[mailer] Error sending OTP email', formatError(error));
        // Reset transporter so next call rebuilds with fresh env vars
        resetTransporter();
        return false;
    }
}

// ── sendPasswordResetOTP ──────────────────────────────────────────────────────
async function sendPasswordResetOTP(to, code) {
    if (!checkConfig()) return false;
    try {
        const senderEmail = process.env.EMAIL_USER;
        const info = await getTransporter().sendMail({
            from: `"Kaarkun" <${senderEmail}>`,
            to,
            subject: 'Password Reset Code – Kaarkun',
            text: `Your password reset code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
                <h2 style="color:#4f46e5;margin-bottom:8px;">Password Reset</h2>
                <p style="color:#374151;font-size:15px;">Use the code below to reset your Kaarkun password. It expires in <strong>10 minutes</strong>.</p>
                <div style="text-align:center;margin:28px 0;">
                  <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#111827;">${code}</span>
                </div>
                <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
              </div>`,
        });
        console.log('[mailer] Password reset OTP sent', { to, messageId: info.messageId });
        return true;
    } catch (error) {
        console.error('[mailer] Error sending password reset OTP', formatError(error));
        resetTransporter();
        return false;
    }
}

// ── sendStatusNotification ────────────────────────────────────────────────────
async function sendStatusNotification(to, status, reason) {
    if (!checkConfig()) return false;
    try {
        const senderEmail = process.env.EMAIL_USER;
        let subject = '';
        let message = '';

        if (status === 'verified') {
            subject = 'Account Approved – Kaarkun';
            message = 'Congratulations! Your provider account has been approved. You can now log in and start receiving jobs.';
        } else if (status === 'rejected') {
            subject = 'Application Update – Kaarkun';
            message = `We regret to inform you that your application has been rejected. Reason: ${reason || 'Not specified'}`;
        } else if (status === 'blocked') {
            subject = 'Account Suspended – Kaarkun';
            message = `Your account has been suspended. Reason: ${reason || 'Not specified'}. Please contact support for more information.`;
        } else {
            return false;
        }

        const info = await getTransporter().sendMail({
            from: `"Kaarkun" <${senderEmail}>`,
            to,
            subject,
            text: message,
            html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;">
                    <h2 style="color:#333;">Kaarkun Update</h2>
                    <p style="font-size:16px;color:#555;">${message}</p>
                    <hr/>
                    <p style="font-size:12px;color:#999;">This is an automated message from Kaarkun Admin.</p>
                   </div>`,
        });
        console.log('[mailer] Status notification sent', { to, messageId: info.messageId });
        return true;
    } catch (error) {
        console.error('[mailer] Error sending status notification', formatError(error));
        resetTransporter();
        return false;
    }
}

// Keep initializeMailer for backwards compat — does a quick test on startup
async function initializeMailer() {
    if (!checkConfig()) return null;
    try {
        const t = getTransporter();
        await t.verify();
        console.log('[mailer] SMTP verification successful');
        return t;
    } catch (error) {
        console.warn('[mailer] SMTP verification failed (email sending may not work):', error.message);
        resetTransporter(); // allow retry next call
        return null;
    }
}

module.exports = { initializeMailer, sendOTP, sendStatusNotification, sendPasswordResetOTP };
