// Pure rules for email login codes. Shared by server functions and tests.
export const CODE_TTL_MS = 10 * 60 * 1000; // codes expire after 10 minutes
export const MAX_WRONG_ATTEMPTS = 5; // locked after 5 wrong tries
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60s between sends to the same email
export const MAX_SENDS_PER_EMAIL_PER_HOUR = 5;
export const MAX_SENDS_PER_IP_PER_HOUR = 20;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function resendWaitSeconds(lastSentAt: Date | null, now: Date) {
  if (!lastSentAt) return 0;
  const left = RESEND_COOLDOWN_MS - (now.getTime() - lastSentAt.getTime());
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

export function isCodeExpired(sentAt: Date, now: Date) {
  return now.getTime() - sentAt.getTime() > CODE_TTL_MS;
}

export function isLocked(failedAttempts: number) {
  return failedAttempts >= MAX_WRONG_ATTEMPTS;
}

export function sendBlockReason(input: {
  lastSentAt: Date | null;
  emailSendsLastHour: number;
  ipSendsLastHour: number;
  now: Date;
}): { code: "cooldown"; wait: number } | { code: "email_limit" | "ip_limit" } | null {
  const wait = resendWaitSeconds(input.lastSentAt, input.now);
  if (wait > 0) return { code: "cooldown", wait };
  if (input.emailSendsLastHour >= MAX_SENDS_PER_EMAIL_PER_HOUR) return { code: "email_limit" };
  if (input.ipSendsLastHour >= MAX_SENDS_PER_IP_PER_HOUR) return { code: "ip_limit" };
  return null;
}
