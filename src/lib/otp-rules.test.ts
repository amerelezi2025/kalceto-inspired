import { describe, it, expect } from "vitest";
import { isCodeExpired, isLocked, resendWaitSeconds, sendBlockReason } from "./otp-rules";

const t0 = new Date("2026-10-08T12:00:00Z");
const after = (s: number) => new Date(t0.getTime() + s * 1000);

describe("otp rules", () => {
  it("code expires after 10 minutes", () => {
    expect(isCodeExpired(t0, after(599))).toBe(false);
    expect(isCodeExpired(t0, after(601))).toBe(true);
  });
  it("locks after 5 wrong attempts", () => {
    expect(isLocked(4)).toBe(false);
    expect(isLocked(5)).toBe(true);
  });
  it("resend waits 60 seconds", () => {
    expect(resendWaitSeconds(t0, after(10))).toBe(50);
    expect(resendWaitSeconds(t0, after(60))).toBe(0);
  });
  it("blocks the 6th send per email per hour", () => {
    expect(sendBlockReason({ lastSentAt: null, emailSendsLastHour: 5, ipSendsLastHour: 0, now: t0 })).toEqual({ code: "email_limit" });
    expect(sendBlockReason({ lastSentAt: null, emailSendsLastHour: 4, ipSendsLastHour: 0, now: t0 })).toBeNull();
  });
  it("blocks the 21st send per IP per hour", () => {
    expect(sendBlockReason({ lastSentAt: null, emailSendsLastHour: 0, ipSendsLastHour: 20, now: t0 })).toEqual({ code: "ip_limit" });
  });
});
