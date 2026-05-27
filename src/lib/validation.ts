export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeEmail(value: unknown): string {
  const email = sanitizeString(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function isValidObjectId(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
