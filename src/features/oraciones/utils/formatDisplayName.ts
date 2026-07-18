/** Formato privado: "Nombre A." — nunca apellido completo ni datos sensibles. */
export function formatDisplayName(
  name: string | null | undefined,
  lastName: string | null | undefined
): { displayName: string; initial: string } {
  const firstName = (name?.trim() || 'Hermano').split(/\s+/)[0];
  const lastInitial = lastName?.trim()?.[0]?.toUpperCase() ?? '';
  const displayName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
  const initial = firstName[0]?.toUpperCase() ?? '?';
  return { displayName, initial };
}

export function getDaysRemaining(expiresAt: Date | string, now = new Date()): number {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const diffMs = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
