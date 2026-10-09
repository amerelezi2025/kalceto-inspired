import { describe, it, expect } from "vitest";
import { isStrongPassword } from "./password-rules";

describe("password strength", () => {
  it("rejects shorter than 10 chars", () => expect(isStrongPassword("Ab1!xyz")).toBe(false));
  it("rejects missing uppercase", () => expect(isStrongPassword("abcdef12!x")).toBe(false));
  it("rejects missing lowercase", () => expect(isStrongPassword("ABCDEF12!X")).toBe(false));
  it("rejects missing number", () => expect(isStrongPassword("Abcdefgh!x")).toBe(false));
  it("rejects missing symbol", () => expect(isStrongPassword("Abcdefgh12")).toBe(false));
  it("accepts a strong password", () => expect(isStrongPassword("Kalceto#2026")).toBe(true));
});
