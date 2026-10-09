export const PASSWORD_MIN_LENGTH = 10;

export const passwordChecks = [
  { label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (p: string) => p.length >= PASSWORD_MIN_LENGTH },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol (like ! ? # @)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function isStrongPassword(p: string) {
  return passwordChecks.every((c) => c.test(p));
}
