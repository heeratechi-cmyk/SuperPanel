import crypto from 'crypto';

export function cryptoUUID(): string {
  return crypto.randomUUID();
}

export function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export function verifyOtpHash(otp: string, hash: string): boolean {
  const computed = crypto.createHash('sha256').update(otp).digest('hex');
  return computed === hash;
}
