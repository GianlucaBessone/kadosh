// src/features/auth/localAuth.ts

// Helper function to hash the PIN
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if a PIN is configured
export function hasLocalPin(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('kadosh_pin_hash');
}

// Set a new PIN
export async function setLocalPin(pin: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const hash = await hashPin(pin);
  localStorage.setItem('kadosh_pin_hash', hash);
  // Also store a session flag so they don't have to re-enter it constantly while app is open
  sessionStorage.setItem('kadosh_unlocked', 'true');
}

// Verify a PIN
export async function verifyLocalPin(pin: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const storedHash = localStorage.getItem('kadosh_pin_hash');
  if (!storedHash) return false;
  
  const hash = await hashPin(pin);
  const isValid = hash === storedHash;
  if (isValid) {
    sessionStorage.setItem('kadosh_unlocked', 'true');
  }
  return isValid;
}

// Check if the app is currently unlocked in this session
export function isAppUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('kadosh_unlocked') === 'true';
}

// Lock the app (clear session)
export function lockApp(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('kadosh_unlocked');
}
