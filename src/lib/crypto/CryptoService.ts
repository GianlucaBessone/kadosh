import _sodium from 'libsodium-wrappers-sumo';

export class CryptoService {
  private static isInitialized = false;

  /**
   * Asegura que libsodium (WebAssembly) esté listo para ser usado.
   * Debe llamarse al inicio de la aplicación o antes de cualquier operación.
   */
  static async init(): Promise<void> {
    if (this.isInitialized) return;
    await _sodium.ready;
    this.isInitialized = true;
  }

  // =========================================================================
  // 1. Derivación de Claves (KDF)
  // =========================================================================

  /**
   * Deriva una Key Encryption Key (KEK) a partir del Recovery Password usando Argon2id.
   * La KEK se usa para cifrar/descifrar la Clave Privada de Identidad del usuario.
   */
  static async deriveKEK(password: string, saltHex: string): Promise<Uint8Array> {
    try {
      await this.init();
      const sodium = _sodium;
      
      const salt = sodium.from_hex(saltHex);
      
      const kek = sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES, // 32 bytes
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      return kek;
    } catch (error) {
      console.warn('Argon2id falló (posible problema con Wasm), utilizando PBKDF2 fallback', error);
      return this.deriveKEK_PBKDF2(password, saltHex);
    }
  }

  /**
   * Fallback nativo: PBKDF2 con SHA-256 (600,000 iteraciones)
   */
  static async deriveKEK_PBKDF2(password: string, saltHex: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const salt = this.hexToUint8Array(saltHex);

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 600000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 32 bytes
    );

    return new Uint8Array(derivedBits);
  }

  /**
   * Genera un Salt criptográficamente seguro (usado para Argon2id)
   */
  static generateSaltHex(): string {
    const salt = new Uint8Array(16); // 16 bytes estándar para salts
    crypto.getRandomValues(salt);
    return this.uint8ArrayToHex(salt);
  }

  // =========================================================================
  // 2. Claves Asimétricas (Identity Keys - Curve25519)
  // =========================================================================

  /**
   * Genera un par de claves de identidad asimétricas (ECDH Curve25519) para el dispositivo/usuario.
   */
  static async generateIdentityKeyPair(): Promise<{ publicKeyHex: string; privateKeyHex: string }> {
    await this.init();
    const sodium = _sodium;
    
    // Generar par de claves para cifrado asimétrico (Curve25519)
    const keyPair = sodium.crypto_box_keypair();
    
    return {
      publicKeyHex: sodium.to_hex(keyPair.publicKey),
      privateKeyHex: sodium.to_hex(keyPair.privateKey)
    };
  }

  // =========================================================================
  // 3. Claves Simétricas (Workspace Keys - AES-256-GCM)
  // =========================================================================

  /**
   * Genera una nueva Workspace Key (Simétrica AES-256) exportable
   */
  static async generateWorkspaceKey(): Promise<CryptoKey> {
    // Usamos WebCrypto nativo para AES-GCM (mucho más rápido que Wasm para cifrar cientos de registros)
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Importa una clave RAW a un CryptoKey de WebCrypto para AES-GCM
   */
  static async importAESKey(rawKeyHex: string): Promise<CryptoKey> {
    const keyBytes = this.hexToUint8Array(rawKeyHex);
    return await crypto.subtle.importKey(
      'raw',
      keyBytes as any,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Exporta un CryptoKey de AES-GCM a formato RAW (Hex)
   */
  static async exportAESKey(key: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey('raw', key);
    return this.uint8ArrayToHex(new Uint8Array(raw));
  }

  // =========================================================================
  // 4. Operaciones de Cifrado Simétrico de Datos (WebCrypto AES-GCM)
  // =========================================================================

  /**
   * Cifra un payload (texto JSON) utilizando la Workspace Key (AES-GCM).
   * Devuelve Base64 que contiene [Nonce (12 bytes) + Ciphertext].
   */
  static async encryptPayload(plaintext: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // IV de 96-bits (12 bytes) estándar para AES-GCM
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data as any
    );

    // Combinar IV + Ciphertext en un solo array
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Retornar en formato Base64 para almacenar en la DB (o Hex)
    return this.uint8ArrayToBase64(combined);
  }

  /**
   * Descifra un payload cifrado (Base64 que contiene [Nonce (12 bytes) + Ciphertext])
   */
  static async decryptPayload(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const combined = this.base64ToUint8Array(encryptedBase64);
    
    // Extraer IV (primeros 12 bytes)
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext as any
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // =========================================================================
  // 5. Cifrado de Claves (Wrapping Keys)
  // =========================================================================

  /**
   * Cifra la Workspace Key (exportada en Hex) usando la Clave Pública de Identidad (Curve25519)
   * Útil para compartir la Workspace Key con otros dispositivos/usuarios.
   */
  static async wrapWorkspaceKey(wkHex: string, recipientPublicKeyHex: string): Promise<string> {
    await this.init();
    const sodium = _sodium;
    
    const message = sodium.from_hex(wkHex);
    const publicKey = sodium.from_hex(recipientPublicKeyHex);
    
    // crypto_box_seal cifra anónimamente con la clave pública
    const encrypted = sodium.crypto_box_seal(message, publicKey);
    
    return sodium.to_hex(encrypted);
  }

  /**
   * Descifra una Workspace Key (Hex) cifrada, utilizando la Clave Privada de Identidad
   */
  static async unwrapWorkspaceKey(wrappedWkHex: string, myPublicKeyHex: string, myPrivateKeyHex: string): Promise<string> {
    await this.init();
    const sodium = _sodium;
    
    const ciphertext = sodium.from_hex(wrappedWkHex);
    const publicKey = sodium.from_hex(myPublicKeyHex);
    const privateKey = sodium.from_hex(myPrivateKeyHex);
    
    const decrypted = sodium.crypto_box_seal_open(ciphertext, publicKey, privateKey);
    
    return sodium.to_hex(decrypted);
  }

  /**
   * Protege la Clave Privada de Identidad cifrándola con la KEK (AES-GCM)
   */
  static async encryptIdentityPrivateKey(privateKeyHex: string, kek: Uint8Array): Promise<string> {
    // Importamos la KEK (Uint8Array de 32 bytes) como CryptoKey AES-GCM
    const aesKey = await crypto.subtle.importKey(
      'raw',
      kek as any,
      'AES-GCM',
      false,
      ['encrypt']
    );
    return this.encryptPayload(privateKeyHex, aesKey);
  }

  /**
   * Desprotege la Clave Privada de Identidad usando la KEK (AES-GCM)
   */
  static async decryptIdentityPrivateKey(encryptedPrivateKeyBase64: string, kek: Uint8Array): Promise<string> {
    const aesKey = await crypto.subtle.importKey(
      'raw',
      kek as any,
      'AES-GCM',
      false,
      ['decrypt']
    );
    return this.decryptPayload(encryptedPrivateKeyBase64, aesKey);
  }

  // =========================================================================
  // Utils de codificación (Hex / Base64)
  // =========================================================================

  static uint8ArrayToHex(arr: Uint8Array): string {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static hexToUint8Array(hex: string): Uint8Array {
    const match = hex.match(/.{1,2}/g);
    if (!match) return new Uint8Array();
    return new Uint8Array(match.map(byte => parseInt(byte, 16)));
  }

  static uint8ArrayToBase64(arr: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(arr).toString('base64');
    }
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(arr[i]);
    }
    return window.btoa(binary);
  }

  static base64ToUint8Array(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // =========================================================================
  // 7. Manejo de Claves Activas en Memoria (Session/Mock para refactor)
  // =========================================================================

  private static activeWorkspaceKeys: Map<string, { id: string; key: CryptoKey }> = new Map();

  /**
   * Obtiene la clave simétrica activa para el Workspace en memoria.
   * Si no existe, genera una (mock) para evitar crashes durante el desarrollo de UI.
   * TODO: Integrar con el flujo real de descifrado del KeyManager cuando se implemente.
   */
  static async getActiveWorkspaceKey(workspaceId: string): Promise<{ id: string; key: CryptoKey }> {
    if (this.activeWorkspaceKeys.has(workspaceId)) {
      return this.activeWorkspaceKeys.get(workspaceId)!;
    }
    
    // Check local storage to prevent data loss on refresh during development
    const lsKey = `mock-wk-${workspaceId}`;
    const storedHex = localStorage.getItem(lsKey);
    
    let mockKey: CryptoKey;
    if (storedHex) {
      mockKey = await this.importAESKey(storedHex);
    } else {
      mockKey = await this.generateWorkspaceKey();
      const exportedHex = await this.exportAESKey(mockKey);
      localStorage.setItem(lsKey, exportedHex);
    }

    const mockKeyData = { id: 'mock-key-id-' + workspaceId, key: mockKey };
    this.activeWorkspaceKeys.set(workspaceId, mockKeyData);
    return mockKeyData;
  }
}
