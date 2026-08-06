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

function getTransportConfig() {
    const emailUser = process.env.EMAIL_USER || '';
    const emailPass = process.env.EMAIL_PASS || '';
    const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.EMAIL_PORT || 587);

    return {
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        host: smtpHost,
        port: smtpPort,
        secure: false,
        service: 'gmail',
    };
}

function validateConfig() {
    const missing = [];
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
    if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS');

    if (missing.length > 0) {
        throw new Error(`[mailer] Missing required SMTP environment variables: ${missing.join(', ')}. Set them in ECS task definition or your local .env file.`);
    }
}

function logConfig() {
    const { auth, host, port } = getTransportConfig();
    const emailPass = auth.pass || '';

    console.log('[mailer] SMTP config loaded', {
        emailUser: auth.user,
        emailPassPresent: Boolean(emailPass),
        emailPassLength: emailPass.length,
        smtpHost: host,
        smtpPort: port,
    });
}

const transporter = nodemailer.createTransport(getTransportConfig());
let initialized = false;
let initPromise = null;

async function initializeMailer() {
    if (initialized) {
        return transporter;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        validateConfig();
        logConfig();

        try {
            await transporter.verify();
            console.log('[mailer] SMTP verification successful');
            initialized = true;
            return transporter;
        } catch (error) {
            console.error('[mailer] SMTP verification failed', formatError(error));
            throw new Error(`[mailer] SMTP verification failed. Check Gmail app password and SMTP settings. ${error.message}`);
        }
    })();

    return initPromise;
}

async function sendOTP(to, code) {
    try {
        await initializeMailer();
        const senderEmail = process.env.EMAIL_USER;

        const info = await transporter.sendMail({
            from: `"Service Hub" <${senderEmail}>`,
            to,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
            html: `<b>Your verification code is: ${code}</b><br/>It will expire in 10 minutes.`,
        });

        console.log('[mailer] OTP email sent', { messageId: info.messageId });
        return true;
    } catch (error) {
        console.error('[mailer] Error sending email', formatError(error));
        return false;
    }
}

async function sendStatusNotification(to, status, reason) {
    try {
        await initializeMailer();
        const senderEmail = process.env.EMAIL_USER;

        let subject = '';
        let message = '';

        if (status === 'verified') {
            subject = 'Account Approved - Service Hub';
            message = 'Congratulations! Your account has been approved. You can now log in and start using our services.';
        } else if (status === 'rejected') {
            subject = 'Application Update - Service Hub';
            message = `We regret to inform you that your application has been rejected. Reason: ${reason || 'Not specified'}`;
        } else if (status === 'blocked') {
            subject = 'Account Suspended - Service Hub';
            message = `Your account has been suspended. Reason: ${reason || 'Not specified'}. Please contact support for more information.`;
        } else {
            return false;
        }

        const info = await transporter.sendMail({
            from: `"Service Hub" <${senderEmail}>`,
            to,
            subject,
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Service Hub Update</h2>
                    <p style="font-size: 16px; color: #555;">${message}</p>
                    <hr/>
                    <p style="font-size: 12px; color: #999;">This is an automated message from Service Hub Admin.</p>
                   </div>`,
        });

        console.log('[mailer] Status notification sent', { messageId: info.messageId });
        return true;
    } catch (error) {
        console.error('[mailer] Error sending status notification', formatError(error));
        return false;
    }
}

module.exports = { initializeMailer, sendOTP, sendStatusNotification };
