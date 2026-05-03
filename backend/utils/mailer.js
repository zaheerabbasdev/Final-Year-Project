const nodemailer = require('nodemailer');

// Configure your email service here
// For testing, you can use ethereal.email or log to console if not configured
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, 
    pool: true, // Use connection pooling
    auth: {
        user: process.env.EMAIL_USER || 'zabbas092002@gmail.com',
        pass: process.env.EMAIL_PASS || 'tjdzryjqdnflmdyt',
    },
    tls: {
        rejectUnauthorized: false // Helps with some network/firewall issues
    }
});

const sendOTP = async (to, code) => {
    try {
        const senderEmail = process.env.EMAIL_USER || 'zabbas092002@gmail.com';
        
        const info = await transporter.sendMail({
            from: `"Service Hub" <${senderEmail}>`,
            to: to,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
            html: `<b>Your verification code is: ${code}</b><br/>It will expire in 10 minutes.`,
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendStatusNotification = async (to, status, reason) => {
    try {
        const senderEmail = process.env.EMAIL_USER || 'zabbas092002@gmail.com';
        
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
            to: to,
            subject: subject,
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Service Hub Update</h2>
                    <p style="font-size: 16px; color: #555;">${message}</p>
                    <hr/>
                    <p style="font-size: 12px; color: #999;">This is an automated message from Service Hub Admin.</p>
                   </div>`,
        });

        console.log('Status notification sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending status notification:', error);
        return false;
    }
};

module.exports = { sendOTP, sendStatusNotification };
