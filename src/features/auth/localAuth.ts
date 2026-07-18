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

// Clear all local auth data (pin, session, and cloud cookies)
export function clearLocalAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('kadosh_pin_hash');
  sessionStorage.removeItem('kadosh_unlocked');
  clearSupabaseCookies();
}

export function clearSupabaseCookies(): void {
  if (typeof window === 'undefined') return;
  document.cookie.split(';').forEach(c => {
    const cookieName = c.split('=')[0].trim();
    if (cookieName.startsWith('sb-')) {
      document.cookie = `${cookieName}=;expires=${new Date(0).toUTCString()};path=/`;
    }
  });
}

// Check if biometrics are supported and enrolled on the device
export async function isBiometricsSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Check if the user has a registered biometric credential in this app
export function hasBiometricsEnrolled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('kadosh_biometric_id');
}

// Helper to convert Uint8Array to Base64 (URL safe)
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to convert Base64url to Uint8Array
function base64urlToBuffer(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Setup a new biometric credential
export async function setupBiometrics(): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Kadosh App" },
        user: { id: userId, name: "Usuario Kadosh", displayName: "Usuario Kadosh" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },  // ES256
          { type: "public-key", alg: -257 } // RS256
        ],
        authenticatorSelection: { 
          authenticatorAttachment: "platform",
          userVerification: "required" // Forces biometrics (FaceID/TouchID/etc)
        },
        timeout: 60000
      }
    });

    if (credential) {
      const rawId = (credential as PublicKeyCredential).rawId;
      localStorage.setItem('kadosh_biometric_id', bufferToBase64url(rawId));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Biometric setup failed:", error);
    return false;
  }
}

// Verify an existing biometric credential
export async function verifyBiometrics(): Promise<boolean> {
  try {
    const credentialIdStr = localStorage.getItem('kadosh_biometric_id');
    if (!credentialIdStr) return false;

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const rawId = base64urlToBuffer(credentialIdStr);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          type: "public-key",
          id: rawId as unknown as BufferSource,
          transports: ["internal"]
        }],
        userVerification: "required",
        timeout: 60000
      }
    });

    if (assertion) {
      sessionStorage.setItem('kadosh_unlocked', 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error("Biometric verification failed:", error);
    return false;
  }
}
