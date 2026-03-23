import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

const router = express.Router();

/**
 * Contact form email limiter
 * 5 emails per 15 minutes per IP (prevent spam)
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' },
});

/**
 * Setup Nodemailer transporter with Gmail SMTP
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'luiscophotobooth@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD, // Google App Password (NOT regular password)
  },
});

/**
 * POST /api/contact
 * Send contact form submission via email
 *
 * Body:
 *   - fullName: string (required)
 *   - email: string (required, valid email)
 *   - subject: string (required)
 *   - message: string (required)
 */
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;

    // ── Validate required fields ──
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // ── Validate email format ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // ── Sanitize input (prevent injection) ──
    const sanitize = (text) => String(text).trim().substring(0, 5000);
    const sanitizedName = sanitize(fullName);
    const sanitizedEmail = sanitize(email);
    const sanitizedSubject = sanitize(subject);
    const sanitizedMessage = sanitize(message);

    // ── Email to you (business owner) ──
    const businessEmail = process.env.BUSINESS_EMAIL || 'luiscophotobooth@gmail.com';

    const mailOptions = {
      from: process.env.GMAIL_USER || 'luiscophotobooth@gmail.com',
      to: businessEmail,
      subject: `[Contact Form] ${sanitizedSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4aa;">New Contact Form Submission</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${sanitizedName}</p>
            <p><strong>Email:</strong> ${sanitizedEmail}</p>
            <p><strong>Subject:</strong> ${sanitizedSubject}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; color: #555;">${sanitizedMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            To reply, send an email to: <strong>${sanitizedEmail}</strong>
          </p>
        </div>
      `,
      replyTo: sanitizedEmail,
    };

    // ── Send email ──
    await transporter.sendMail(mailOptions);

    // ── Optional: Send confirmation email to user ──
    const userConfirmation = {
      from: process.env.GMAIL_USER || 'luiscophotobooth@gmail.com',
      to: sanitizedEmail,
      subject: 'We received your message - Luis&Co. Photobooth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4aa;">Thank you for contacting us!</h2>
          
          <p>Hi ${sanitizedName},</p>
          
          <p>We've received your message and will get back to you within 1-2 business days.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Subject:</strong> ${sanitizedSubject}</p>
          </div>
          
          <p>Best regards,<br/>
          <strong>Luis&Co. Photobooth Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(userConfirmation);

    // ── Success response ──
    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon.',
    });
  } catch (error) {
    console.error('Contact form error:', error);

    // ── Error response ──
    res.status(500).json({
      error: 'Failed to send message. Please try again or contact us directly at luiscophotobooth@gmail.com',
    });
  }
});

export default router;
