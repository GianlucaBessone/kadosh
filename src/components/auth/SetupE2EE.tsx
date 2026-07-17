'use client';

import React, { useState } from 'react';
import { CryptoService } from '@/lib/crypto/CryptoService';

export function SetupE2EE({ onComplete }: { onComplete: (keyData: any) => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // 1. Generar Salt y KEK
      const salt = CryptoService.generateSaltHex();
      const kek = await CryptoService.deriveKEK(password, salt);

      // 2. Generar Identity Keys
      const identityKeys = await CryptoService.generateIdentityKeyPair();

      // 3. Proteger la Identity Private Key con la KEK
      const protectedPrivateKey = await CryptoService.encryptIdentityPrivateKey(
        identityKeys.privateKeyHex,
        kek
      );

      // 4. Generar Workspace Key
      const workspaceKey = await CryptoService.generateWorkspaceKey();
      const workspaceKeyHex = await CryptoService.exportAESKey(workspaceKey);

      // 5. Wrap la Workspace Key con la Identity Public Key
      const wrappedWorkspaceKey = await CryptoService.wrapWorkspaceKey(
        workspaceKeyHex,
        identityKeys.publicKeyHex
      );

      // Enviar datos al componente padre para guardar en Supabase/IndexedDB
      onComplete({
        salt,
        publicKey: identityKeys.publicKeyHex,
        protectedPrivateKey,
        wrappedWorkspaceKey,
      });

    } catch (err: any) {
      setError(err.message || 'Error al configurar E2EE');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Contraseña de Recuperación</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
        Esta contraseña protege tus datos financieros cifrados. <br/>
        <strong>Será necesaria únicamente si pierdes todos tus dispositivos.</strong> Nosotros no podemos recuperarla por vos.
      </p>

      <form onSubmit={handleSetup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500"
            required
            disabled={isGenerating}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500"
            required
            disabled={isGenerating}
          />
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex justify-center items-center"
        >
          {isGenerating ? (
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
          ) : null}
          {isGenerating ? 'Generando Claves...' : 'Proteger mi cuenta'}
        </button>
      </form>
    </div>
  );
}
