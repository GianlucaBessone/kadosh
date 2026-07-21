# Pruebas Automatizadas - KADOSH

Este directorio contiene toda la infraestructura de testing automatizado de KADOSH, garantizando la resiliencia y el comportamiento Offline-First de los módulos clave.

## Estructura

- `/tests/unit/`: Tests unitarios de servicios, algoritmos y pipelines lógicos (Vitest).
- `/tests/integration/`: Tests de integración de componentes UI y Custom Hooks con React Testing Library (RTL).
- `/tests/e2e/`: Tests End-to-End con Playwright, diseñados para probar flujos de red reales y offline.
- `/tests/setup.ts`: Configuración global de Vitest y mocks (fake-indexeddb, variables de entorno).

## Stack Tecnológico

- **Vitest**: Motor principal para Unit & Integration testing. Rápido y con soporte ESM.
- **React Testing Library (RTL)**: Para simular interacciones de usuario en componentes.
- **Playwright**: Para pruebas End-to-End, simulación de múltiples navegadores y desconexiones de red (Offline-First tests).
- **fake-indexeddb**: Para testear Dexie en Node.js sin navegador.

## Ejecución

1. **Unit & Integration Tests**
   \`\`\`bash
   pnpm test
   \`\`\`

2. **Modo Watch (Desarrollo)**
   \`\`\`bash
   pnpm test:watch
   \`\`\`

3. **End-to-End Tests (Offline & Realtime)**
   \`\`\`bash
   pnpm test:e2e
   \`\`\`

4. **Reporte de Cobertura**
   \`\`\`bash
   pnpm test:coverage
   \`\`\`

## Continuous Integration (CI)

Todos los tests son ejecutados automáticamente por GitHub Actions (\`.github/workflows/test.yml\`) en cada push o pull request a las ramas `develop` y `main`. El pipeline validará que ningún cambio rompa el comportamiento Offline-First.
