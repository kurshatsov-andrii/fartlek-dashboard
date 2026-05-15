/**
 * Список email адміністраторів у `ADMIN_EMAIL_ALLOWLIST` через кому чи крапку з комою.
 */
export function parseAdminEmailAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;]+/u)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminGateConfigured(): boolean {
  return parseAdminEmailAllowlist().size > 0;
}

export function isAllowedAdminEmail(
  email: string | undefined | null,
): boolean {
  const e = email?.trim().toLowerCase();
  if (!e) return false;
  return parseAdminEmailAllowlist().has(e);
}
