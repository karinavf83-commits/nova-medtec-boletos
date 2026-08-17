// Only these e-mails may create an administrator account for the Nova Medtec
// boleto request panel. Configure via ADMIN_EMAIL_ALLOWLIST (comma-separated)
// in the environment; falls back to Karina's e-mail if unset.
function getAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? "karinavf83@gmail.com";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowedAdmin(email: string): boolean {
  return getAllowlist().includes(email.trim().toLowerCase());
}
