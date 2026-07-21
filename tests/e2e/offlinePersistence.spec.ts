import { test, expect } from '@playwright/test';

test.describe('Offline Persistence', () => {
  test('las peticiones locales sobreviven a la recarga de página (Local First)', async ({ page }) => {
    // Necesitamos navegar a una página cualquiera para inyectar datos
    await page.goto('/');
    
    // Inyectar auth en localStorage
    await page.evaluate(() => {
      localStorage.setItem('kadosh_pin_hash', 'dummy-hash');
      sessionStorage.setItem('kadosh_unlocked', 'true');
    });

    // Inyectar un usuario falso en IndexedDB a través de Dexie expuesto
    await page.evaluate(async () => {
      // @ts-ignore
      const db = window.__KADOSH_DB__;
      if (db) {
        await db.users.clear();
        await db.users.put({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          avatarUrl: null,
          isCloudLinked: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null
        });
      }
    });

    await page.goto('/oraciones');
    
    // 1. Escribir una petición
    const textArea = page.getByRole('textbox', { name: /Motivo de oración/i });
    await expect(textArea).toBeVisible({ timeout: 10000 });
    await textArea.fill('Petición de persistencia Offline');

    const submitBtn = page.getByRole('button', { name: /Publicar petición/i });
    await submitBtn.click();

    // 2. Verificar que aparece en la UI
    await expect(page.locator('p', { hasText: 'Petición de persistencia Offline' }).first()).toBeVisible();

    // 3. Forzar una recarga completa (Clear in-memory React State)
    await page.reload();

    // 4. Verificar que al cargar la página, el componente lee inmediatamente de Dexie
    // (Aún antes de que el servidor devuelva resultados)
    await expect(page.locator('p', { hasText: 'Petición de persistencia Offline' }).first()).toBeVisible();
  });
});
