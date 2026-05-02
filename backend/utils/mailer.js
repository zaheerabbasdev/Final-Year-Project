const nodemailer = require('nodemailer');

// Configure your email service here
// For testing, you can use ethereal.email or log to console if not configured
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'zabbas092002@gmail.com',
        pass: process.env.EMAIL_PASS || 'tjdzryjqdnflmdyt',
    },
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

module.exports = { sendOTP };
