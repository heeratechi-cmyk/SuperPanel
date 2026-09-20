import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'nadeem07381@gmail.com';
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || 'xase gnrj hsdp itpb';

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false
    }
  });

  return cachedTransporter;
};

const getSenderEmail = (): string => {
  let email = process.env.SMTP_USER || 'nadeem07381@gmail.com';
  if (process.env.SMTP_FROM) {
    const angleMatch = process.env.SMTP_FROM.match(/<([^>]+)>/);
    if (angleMatch && angleMatch[1]) {
      email = angleMatch[1].trim();
    } else if (process.env.SMTP_FROM.includes('@')) {
      email = process.env.SMTP_FROM.trim();
    }
  }
  return email;
};

const getFromAddress = () => {
  const senderEmail = getSenderEmail();
  return {
    name: 'SuperPanel',
    address: senderEmail
  };
};

const getReplyToAddress = () => {
  const senderEmail = getSenderEmail();
  return {
    name: 'SuperPanel Support',
    address: senderEmail
  };
};

export async function testSmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true, message: 'Gmail SMTP Connection successful!' };
  } catch (err: any) {
    console.warn('[SMTP Test Error]:', err.message);
    return { success: false, message: err.message || 'Failed to connect to SMTP server.' };
  }
}

export async function sendOtpEmail(toEmail: string, otp: string, username?: string) {
  const from = getFromAddress();
  const replyTo = getReplyToAddress();
  const displayUser = username && username.trim() ? username.trim() : 'User';
  
  const text = `SuperPanel - Email Verification Code\n\nHello ${displayUser},\n\nYour 6-digit verification code is: ${otp}\n\nAccount Details:\n• Username: @${displayUser}\n• Email: ${toEmail}\n\nThis security code expires in 1 minute. Please enter it in your browser to verify your SuperPanel account.\n\nIf you did not request this verification code, please ignore this message.\n\nSuperPanel Security Team\nsupport@superpanel.com`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SuperPanel Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <tr>
                <td style="background-color: #4f46e5; padding: 24px; text-align: center;">
                  <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">SUPERPANEL</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 28px;">
                  <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Verify Your Email Address</h1>
                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                    Hello <strong style="color: #4f46e5;">${displayUser}</strong>, use the verification code below to verify your SuperPanel account:
                  </p>

                  <div style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 10px 16px; margin: 0 auto 20px auto; text-align: center;">
                    <span style="font-size: 12px; color: #64748b;">Account Username: </span>
                    <strong style="font-size: 13px; color: #0f172a; font-family: monospace;">@${displayUser}</strong>
                    <span style="font-size: 12px; color: #cbd5e1; margin: 0 8px;">|</span>
                    <span style="font-size: 12px; color: #64748b;">Email: </span>
                    <strong style="font-size: 13px; color: #0f172a;">${toEmail}</strong>
                  </div>
                  
                  <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #cbd5e1; padding: 20px; text-align: center; margin: 0 auto 24px auto;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">${otp}</span>
                  </div>

                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #e11d48; font-weight: 600; text-align: center;">This code will expire in 1 minute.</p>
                  <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">Do not share this security code with anyone. SuperPanel support staff will never ask for your code.</p>
                  
                  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  
                  <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
                    If you did not request this email, you can safely ignore it. Your account remains secure.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SuperPanel Services. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from,
      replyTo,
      to: toEmail,
      subject: `SuperPanel - Verification Code: ${otp}`,
      text,
      html
    });
    console.log(`[Email Delivered] OTP sent to ${toEmail} for @${displayUser}`);
  } catch (err: any) {
    console.warn(`[Email Delivery Issue] Failed to send OTP to ${toEmail}: ${err.message}`);
    console.log(`[DEV FALLBACK OTP] Active OTP for ${toEmail} (@${displayUser}) is: ${otp}`);
  }
}

export async function sendPasswordResetOtpEmail(toEmail: string, otp: string, username?: string) {
  const from = getFromAddress();
  const replyTo = getReplyToAddress();
  const displayUser = username && username.trim() ? username.trim() : 'User';
  
  const text = `SuperPanel - Password Reset Code\n\nHello ${displayUser},\n\nYour 6-digit password reset code is: ${otp}\n\nAccount Details:\n• Username: @${displayUser}\n• Email: ${toEmail}\n\nThis security code expires in 1 minute. Enter this code to set a new password.\n\nIf you did not request a password reset, please ignore this message.\n\nSuperPanel Security Team\nsupport@superpanel.com`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SuperPanel Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              <tr>
                <td style="background-color: #4f46e5; padding: 24px; text-align: center;">
                  <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">SUPERPANEL</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 28px;">
                  <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Password Reset Request</h1>
                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: center;">
                    Hello <strong style="color: #4f46e5;">${displayUser}</strong>, use the verification code below to reset your SuperPanel password:
                  </p>

                  <div style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 10px 16px; margin: 0 auto 20px auto; text-align: center;">
                    <span style="font-size: 12px; color: #64748b;">Account Username: </span>
                    <strong style="font-size: 13px; color: #0f172a; font-family: monospace;">@${displayUser}</strong>
                    <span style="font-size: 12px; color: #cbd5e1; margin: 0 8px;">|</span>
                    <span style="font-size: 12px; color: #64748b;">Email: </span>
                    <strong style="font-size: 13px; color: #0f172a;">${toEmail}</strong>
                  </div>
                  
                  <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #cbd5e1; padding: 20px; text-align: center; margin: 0 auto 24px auto;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">${otp}</span>
                  </div>

                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #e11d48; font-weight: 600; text-align: center;">This code will expire in 1 minute.</p>
                  <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">Never share this verification code with anyone.</p>
                  
                  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  
                  <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
                    If you did not request a password reset, please secure your account immediately or contact support.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SuperPanel Services. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from,
      replyTo,
      to: toEmail,
      subject: `SuperPanel - Password Reset Code: ${otp}`,
      text,
      html
    });
    console.log(`[Email Delivered] Password reset OTP sent to ${toEmail}`);
  } catch (err: any) {
    console.warn(`[Email Delivery Issue] Failed to send reset OTP to ${toEmail}: ${err.message}`);
    console.log(`[DEV FALLBACK RESET OTP] Reset OTP for ${toEmail} is: ${otp}`);
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const text = `SuperPanel - Password Reset\n\nClick the link below to reset your password:\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.\n\nSuperPanel Security Team`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <tr>
                <td style="background-color: #4f46e5; padding: 24px; text-align: center;">
                  <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">SUPERPANEL</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 28px; text-align: center;">
                  <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Reset Your Password</h1>
                  <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">You requested a password reset for your SuperPanel account. Click the button below to set a new password:</p>
                  
                  <div style="margin-bottom: 24px;">
                    <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">Reset Password</a>
                  </div>

                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">Button not working? Copy and paste this link into your browser:</p>
                  <p style="margin: 0 0 20px 0; font-size: 12px; color: #4f46e5; word-break: break-all;">${resetUrl}</p>

                  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">If you didn't request this, you can safely ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SuperPanel Services. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      replyTo: getReplyToAddress(),
      to: toEmail,
      subject: 'SuperPanel - Reset your password',
      text,
      html
    });
  } catch (err: any) {
    console.warn(`[Email Delivery Issue] Reset link error: ${err.message}`);
    console.log(`[DEV FALLBACK RESET LINK] Reset link for ${toEmail}: ${resetUrl}`);
  }
}

export async function sendEmail(toEmail: string, subject: string, content: string) {
  const textContent = content.replace(/<[^>]*>/g, '').trim() || content;
  const htmlContent = content.startsWith('<') ? content : `<p style="font-size:14px; color:#334155; line-height:1.6;">${content}</p>`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      replyTo: getReplyToAddress(),
      to: toEmail,
      subject,
      text: textContent,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8"><title>${subject}</title></head>
        <body style="margin:0; padding:24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f1f5f9; color:#1e293b;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:500px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; padding:24px;">
            <tr>
              <td>
                <div style="font-weight:800; color:#4f46e5; font-size:18px; margin-bottom:16px;">SUPERPANEL</div>
                ${htmlContent}
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });
    console.log(`[Email Sent] Subject: "${subject}" to ${toEmail}`);
  } catch (err: any) {
    console.warn(`[Email Send Error] To: ${toEmail}, Reason: ${err.message}`);
  }
}

export async function sendDepositNotificationEmail(toEmail: string, status: 'Submitted' | 'Approved' | 'Rejected', amount: number, details?: string) {
  const title = status === 'Approved' ? 'Deposit Approved' : status === 'Rejected' ? 'Deposit Request Update' : 'Deposit Submitted';
  const color = status === 'Approved' ? '#16a34a' : status === 'Rejected' ? '#e11d48' : '#d97706';
  const text = `SuperPanel - Deposit Update\n\nStatus: ${status}\nAmount: Rs. ${amount.toLocaleString()}${details ? `\nDetails: ${details}` : ''}\n\nSuperPanel Financial Support\nsupport@superpanel.com`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>SuperPanel Deposit Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <tr>
                <td style="background-color: #4f46e5; padding: 20px; text-align: center;">
                  <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">SUPERPANEL</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px; text-align: center;">
                  <h2 style="margin: 0 0 8px 0; font-size: 18px; color: ${color};">${title}</h2>
                  <p style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a; font-weight: 800;">Rs. ${amount.toLocaleString()}</p>
                  ${details ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">${details}</p>` : ''}
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">Transaction processed automatically by SuperPanel Wallet.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SuperPanel Services. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      replyTo: getReplyToAddress(),
      to: toEmail,
      subject: `SuperPanel - Deposit ${status}: Rs. ${amount.toLocaleString()}`,
      text,
      html
    });
    console.log(`[Deposit Notification Email]: ${status} for ${toEmail}`);
  } catch (err: any) {
    console.warn(`[Deposit Notification Email Failed]: ${err.message}`);
  }
}
