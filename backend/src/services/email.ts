import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'nadeem07381@gmail.com';
  const pass = process.env.SMTP_PASSWORD || 'xase gnrj hsdp itpb';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false
    }
  });
};

const getFromAddress = () => {
  return process.env.SMTP_FROM || '"SuperPanel Security" <nadeem07381@gmail.com>';
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

export async function sendOtpEmail(toEmail: string, otp: string) {
  const from = getFromAddress();
  const replyTo = process.env.SMTP_USER || 'nadeem07381@gmail.com';
  const messageId = `<otp-${Date.now()}.${Math.random().toString(36).substring(2, 8)}@superpanel.local>`;
  const text = `SuperPanel Verification Code: ${otp}\n\nHello,\n\nYour security verification code is: ${otp}\n\nThis code expires in 1 minute. Do not share this code with anyone.\n\nBest regards,\nSuperPanel Security Team`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SuperPanel Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #1e293b; border-radius: 20px; border: 1px solid #334155; padding: 36px 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td align="center">
                  <div style="display: inline-block; padding: 12px 20px; background-color: #312e81; border-radius: 12px; border: 1px solid #4338ca; margin-bottom: 24px;">
                    <span style="font-size: 18px; font-weight: 900; color: #818cf8; letter-spacing: 2px;">SUPERPANEL</span>
                  </div>
                  <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #ffffff;">Email Verification Code</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">Please use the verification code below to complete your authentication request:</p>
                  
                  <div style="background-color: #0f172a; border-radius: 16px; border: 1px solid #4f46e5; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #a5b4fc; display: inline-block;">${otp}</span>
                  </div>

                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #f87171; font-weight: 700;">• Valid for 1 minute only</p>
                  <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">If you did not initiate this request, please secure your account immediately.</p>
                  
                  <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
                  <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center;">SuperPanel Automated Security System • Do not reply directly to this email</p>
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
      subject: `Your SuperPanel Verification Code (${otp})`,
      text,
      html,
      headers: {
        'Message-ID': messageId,
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Mailer': 'SuperPanel Security Core v2.0',
        'List-Unsubscribe': `<mailto:${replyTo}?subject=unsubscribe>`
      }
    });
    console.log(`[Email Delivered] OTP code sent successfully to ${toEmail}`);
  } catch (err: any) {
    console.warn(`[Email Delivery Issue] Failed to send OTP to ${toEmail}: ${err.message}`);
    console.log(`[DEV FALLBACK OTP] Active OTP for ${toEmail} is: ${otp}`);
  }
}

export async function sendPasswordResetOtpEmail(toEmail: string, otp: string) {
  const from = getFromAddress();
  const replyTo = process.env.SMTP_USER || 'nadeem07381@gmail.com';
  const messageId = `<reset-${Date.now()}.${Math.random().toString(36).substring(2, 8)}@superpanel.local>`;
  const text = `SuperPanel Password Reset Code: ${otp}\n\nHello,\n\nYour password reset code is: ${otp}\n\nThis code expires in 1 minute. Do not share this code with anyone.\n\nBest regards,\nSuperPanel Security Team`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SuperPanel Password Reset Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #1e293b; border-radius: 20px; border: 1px solid #334155; padding: 36px 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td align="center">
                  <div style="display: inline-block; padding: 12px 20px; background-color: #312e81; border-radius: 12px; border: 1px solid #4338ca; margin-bottom: 24px;">
                    <span style="font-size: 18px; font-weight: 900; color: #818cf8; letter-spacing: 2px;">SUPERPANEL</span>
                  </div>
                  <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #ffffff;">Password Reset Verification</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">Use the security code below to reset your SuperPanel account password:</p>
                  
                  <div style="background-color: #0f172a; border-radius: 16px; border: 1px solid #a855f7; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #c084fc; display: inline-block;">${otp}</span>
                  </div>

                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #f87171; font-weight: 700;">• Valid for 1 minute only</p>
                  <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">If you did not request a password reset, please ignore this email.</p>
                  
                  <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
                  <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center;">SuperPanel Automated Security System • Do not reply directly to this email</p>
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
      subject: `SuperPanel Security Code: ${otp}`,
      text,
      html,
      headers: {
        'Message-ID': messageId,
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Mailer': 'SuperPanel Security Core v2.0',
        'List-Unsubscribe': `<mailto:${replyTo}?subject=unsubscribe>`
      }
    });
    console.log(`[Email Delivered] Password reset OTP sent successfully to ${toEmail}`);
  } catch (err: any) {
    console.warn(`[Email Delivery Issue] Failed to send reset OTP to ${toEmail}: ${err.message}`);
    console.log(`[DEV FALLBACK RESET OTP] Reset OTP for ${toEmail} is: ${otp}`);
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const text = `SuperPanel Password Reset Request\n\nClick or open the link below to reset your password:\n${resetUrl}\n\nIf you did not request a password reset, please ignore this email.`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
              <tr>
                <td align="center" style="background-color: #4f46e5; padding: 24px 20px; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">SUPERPANEL</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.9; text-transform: uppercase;">Security Notice</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 24px; text-align: center;">
                  <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #ffffff;">Reset Your Password</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; color: #cbd5e1; line-height: 1.5;">You requested a password reset for your SuperPanel account. Click the button below to set a new password:</p>
                  
                  <div style="margin-bottom: 24px;">
                    <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);">Reset Password</a>
                  </div>

                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">If you didn't request this, you can safely ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #0f172a; border-top: 1px solid #334155; padding: 16px 20px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #64748b;">&copy; 2026 SuperPanel Services. All rights reserved.</p>
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
      to: toEmail,
      subject: 'Reset your SuperPanel password',
      text,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Mailer': 'SuperPanel Security Core v2.0'
      }
    });
  } catch (err: any) {
    console.warn(`[Email Delivery Issue] Reset link error: ${err.message}`);
    console.log(`[DEV FALLBACK RESET LINK] Reset link for ${toEmail}: ${resetUrl}`);
  }
}

export async function sendEmail(toEmail: string, subject: string, content: string) {
  const textContent = content.replace(/<[^>]*>/g, '').trim() || content;
  const htmlContent = content.startsWith('<') ? content : `<p style="font-size:14px; color:#cbd5e1; line-height:1.5;">${content}</p>`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Mailer': 'SuperPanel Mail System'
      }
    });
    console.log(`[Email Sent] Subject: "${subject}" to ${toEmail}`);
  } catch (err: any) {
    console.warn(`[Email Send Error] To: ${toEmail}, Reason: ${err.message}`);
  }
}

export async function sendDepositNotificationEmail(toEmail: string, status: 'Submitted' | 'Approved' | 'Rejected', amount: number, details?: string) {
  const title = status === 'Approved' ? 'Deposit Approved' : status === 'Rejected' ? 'Deposit Request Update' : 'Deposit Submitted';
  const color = status === 'Approved' ? '#22c55e' : status === 'Rejected' ? '#f43f5e' : '#f59e0b';
  const text = `SuperPanel Deposit Update\n\nStatus: ${status}\nAmount: Rs. ${amount.toLocaleString()}${details ? `\nDetails: ${details}` : ''}\n\nSuperPanel Support`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SuperPanel Deposit Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #1e293b; border-radius: 20px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
              <tr>
                <td align="center" style="background-color: #4f46e5; padding: 24px 20px; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">SUPERPANEL</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.9; text-transform: uppercase;">Deposit Notification</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 24px; text-align: center;">
                  <h2 style="margin: 0 0 12px 0; font-size: 20px; color: ${color};">${title}</h2>
                  <p style="margin: 0 0 12px 0; font-size: 18px; color: #ffffff; font-weight: 800;">Amount: Rs. ${amount.toLocaleString()}</p>
                  ${details ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #cbd5e1;">${details}</p>` : ''}
                </td>
              </tr>
              <tr>
                <td style="background-color: #0f172a; border-top: 1px solid #334155; padding: 16px 20px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #64748b;">&copy; 2026 SuperPanel Services. All rights reserved.</p>
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
      to: toEmail,
      subject: `Deposit ${status}: Rs. ${amount.toLocaleString()} - SuperPanel`,
      text,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Mailer': 'SuperPanel Mail System'
      }
    });
  } catch (err) {
    console.log(`[Deposit Notification Email]: ${status} for ${toEmail}`);
  }
}

