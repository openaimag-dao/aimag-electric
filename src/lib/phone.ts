/**
 * Reduces a phone number to its last 10 digits — the actual subscriber
 * number in Kazakhstan/Russia numbering, independent of how the country/
 * trunk prefix was written (`+7`, `8`, `7`, with or without spacing).
 * Returns null when there aren't enough digits to identify a real
 * subscriber, so short or garbage input never produces a false match.
 */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}
