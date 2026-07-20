# Protocolo de Pruebas: Módulo de Oraciones (REST + Outbox)

Este documento detalla los escenarios de prueba exigidos para dar por validada la nueva arquitectura del módulo de Oraciones. Se debe verificar cada comportamiento de forma manual o mediante E2E tests.

## 1. Dispositivo Online (Flujo Feliz)
- [ ] **Creación:** El usuario crea una petición. 
  - *Resultado esperado:* Aparece instantáneamente en su lista. En Supabase se registra el mismo UUID y el nombre correcto del creador (no "Usuario").
- [ ] **Interacción:** El usuario toca "He orado" o "Unirme".
  - *Resultado esperado:* El contador sube a 1 instantáneamente. En Supabase se refleja la interacción (idempotente si se toca dos veces).
- [ ] **Cancelación:** El usuario cancela su propia petición.
  - *Resultado esperado:* Desaparece de su lista activa y pasa a historial. En Supabase cambia a `status = ARCHIVED`. El contador global de "Personas acompañadas hoy" disminuye.

## 2. Dispositivo Offline
- [ ] Desactivar el WiFi/Datos del dispositivo.
- [ ] **Creación Offline:** Crear una petición.
  - *Resultado esperado:* Aparece instantáneamente en la UI (Optimistic UI). Dexie guarda el registro y la `SyncQueue` encola un `INSERT`.
- [ ] **Interacción Offline:** Orar por una petición existente.
  - *Resultado esperado:* La UI reacciona. Dexie actualiza el contador localmente y la `SyncQueue` encola un `PRAYED`.
- [ ] Verificar que en Supabase no hay cambios (obviamente, no hay red).

## 3. Reapertura con Internet (Reintentos Automáticos)
- [ ] Sin reconectar a internet, cerrar completamente la aplicación (kill app).
- [ ] Reactivar el WiFi/Datos.
- [ ] Abrir la aplicación.
  - *Resultado esperado:* Al iniciar, `SyncEngine` procesa la `SyncQueue`. Las tareas pendientes se envían al servidor en el orden correcto. Revisar Supabase para verificar que la petición y la interacción offline ahora existen con el UUID original.

## 4. Conflictos
- [ ] **Interacción en petición eliminada:**
  1. Usuario A y Usuario B están online y ven la Petición X.
  2. Usuario A se desconecta.
  3. Usuario B cancela/elimina la Petición X.
  4. Usuario A (offline) toca "He orado" en la Petición X.
  5. Usuario A se reconecta.
  - *Resultado esperado:* La API devuelve un status `410` o `404`. El worker de `SyncQueue` captura este código, descarta la tarea de la cola marcándola como `SYNCED` (o manejada) y elimina/archiva la Petición X en el Dexie del Usuario A.
  
## 5. Duplicados e Idempotencia
- [ ] Simular un timeout o doble envío (enviando el mismo POST manual dos veces con el mismo body).
  - *Resultado esperado:* El servidor detecta el UUID duplicado. La primera vez crea el registro (200 OK). La segunda vez detecta el UUID y devuelve 200 OK con `alreadyCreated: true`, sin insertar un duplicado en base de datos ni alterar los contadores de interacción si es un "pray/join".
