# Contact Form Email Setup Guide

Your contact form is now functional and will send emails to `luiscophotobooth@gmail.com` using Gmail's SMTP server via nodemailer.

## Required Setup (One-time)

### 1. Create a Gmail App Password

You need to set up a **Google App Password** so nodemailer can send emails securely without storing your actual Gmail password.

**Steps:**

1. Go to: https://myaccount.google.com/apppasswords
   - (You may need to sign in with your Gmail account first)
   
2. Select:
   - **App:** "Mail"
   - **Device:** "Windows Computer" (or your OS)
   
3. Google will generate a **16-character password**. Copy it.

4. Add to `server/.env`:
   ```env
   GMAIL_USER=luiscophotobooth@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### 2. Optional: Custom Business Email

If you want contact form emails sent to a different address:

Add to `server/.env`:
```env
BUSINESS_EMAIL=your-business-email@example.com
```

## How It Works

**When a user submits the contact form:**

1. ✅ Frontend sends form data to `POST /api/contact`
2. ✅ Backend validates and sanitizes the data
3. ✅ Sends an email to you (business owner) with their message
4. ✅ Sends a confirmation email to the user
5. ✅ Returns success response to frontend
6. ✅ User sees "Message Sent!" confirmation

## Security Features Included

- ✅ **Rate limiting:** 5 emails per 15 minutes per IP (prevents spam/abuse)
- ✅ **Input validation:** Email format, field length checks
- ✅ **Input sanitization:** Escapes HTML to prevent injection
- ✅ **Error handling:** Graceful failures with user-friendly messages
- ✅ **Reply-To header:** You can reply directly to user emails

## Testing

1. Visit your contact form at `/contact`
2. Fill out all fields and submit
3. Check `luiscophotobooth@gmail.com` inbox for the message
4. Check the sender's email inbox for confirmation

## Troubleshooting

**"Failed to send message" error:**
- ✅ Check `GMAIL_APP_PASSWORD` is set correctly in `server/.env`
- ✅ Verify Gmail account has 2-factor authentication enabled (required for App Passwords)
- ✅ Ensure the App Password was generated correctly (16 characters with spaces)

**"Too many messages sent" error:**
- Wait 15 minutes before trying again (rate limit protection)

**No email received:**
- Check spam/junk folder
- Verify email address is correct
- Check server logs for errors

## Production Notes

**Gmail limits:**
- ~500 emails/day for personal Gmail accounts
- Suitable for small business inquiries
- If you need higher volume, consider SendGrid or Mailgun

**For higher volume or custom domain:**

Replace nodemailer config in `server/src/routes/contact.js`:

```javascript
// Option 1: SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Option 2: Custom SMTP (any provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
```

---

**Everything is set up and ready to go!** Just add your Gmail App Password to `server/.env` and start receiving contact form submissions.
