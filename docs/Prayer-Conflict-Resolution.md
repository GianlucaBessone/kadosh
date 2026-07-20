# Resolución de Conflictos: Módulo de Oraciones

Dado que el módulo de Oraciones utilizará una arquitectura basada en **REST + SyncQueue (Outbox Pattern)** garantizando persistencia Offline-First, es fundamental definir cómo el sistema manejará los conflictos de sincronización cuando el dispositivo se vuelva a conectar y procese la cola.

La regla general es que **el servidor (Prisma) siempre tiene la última palabra**, y todas las operaciones (REST endpoints) deben diseñarse para ser **idempotentes**.

## Escenarios de Conflicto

### 1. Petición cancelada por el creador mientras otro usuario estaba offline y se unió
- **Contexto:** El Creador A cancela su petición. El Servidor actualiza el estado a `ARCHIVED`. El Usuario B (que no tiene internet) ve la petición activa en su caché, y decide darle a "Unirse". La acción "Unirse" queda en la `SyncQueue` de B.
- **Resolución al recuperar conexión:** 
  1. La `SyncQueue` de B envía la petición `POST /api/prayer-requests/[id]/join`.
  2. El servidor detecta que la petición está `ARCHIVED`.
  3. El servidor devuelve un código `410 Gone` o `400 Bad Request` indicando "Petición no activa".
  4. **Comportamiento esperado en B:** El Worker de SyncQueue captura el `410`, marca la tarea como procesada (descartada), y actualiza localmente (Dexie) el estado de la petición a `ARCHIVED` para sincronizar la caché local de B con el estado real del servidor. B ya no verá la petición activa.

### 2. Usuario intenta orar por una petición ya vencida
- **Contexto:** La petición caducó según su `expiresAt`. Un usuario offline no recibió la actualización y presiona "He orado".
- **Resolución al recuperar conexión:**
  1. El servidor recibe `POST /api/prayer-requests/[id]/pray`.
  2. El servidor detecta que la fecha actual es posterior al `expiresAt` de la petición.
  3. El servidor devuelve `410 Gone`.
  4. **Comportamiento esperado:** La tarea se descarta de la cola y Dexie actualiza su caché marcándola como expirada/archivada.

### 3. Duplicación de solicitudes por inestabilidad de red (Idempotencia)
- **Contexto:** El usuario presiona "Cancelar". El teléfono envía el request al servidor, el servidor la cancela, pero la conexión se cae antes de recibir la confirmación (código 200). La tarea sigue en `SyncQueue` y se vuelve a intentar más tarde.
- **Resolución al recuperar conexión:**
  1. El servidor recibe por segunda vez `POST /api/prayer-requests/[id]/cancel`.
  2. El servidor detecta que ya está cancelada.
  3. **Comportamiento esperado:** En lugar de lanzar error, la API debe devolver `200 OK` (idempotencia) con un flag `{ success: true, alreadyCancelled: true }`. El cliente limpia la cola y da la operación por exitosa.

### 4. Resolución de IDs
- Al crear una petición offline, el cliente generará el **UUID definitivo**.
- Si por inestabilidad el POST de creación se envía dos veces, el servidor utilizará `upsert` (o validará la existencia del ID) para evitar duplicaciones.
- Si el ID ya existe y pertenece al mismo creador, la API devuelve `200 OK` sin alterar el `prayerCount`.

## Manejo de la Cola (SyncQueue) en Cierres Inesperados
1. La `SyncQueue` reside en IndexedDB (Dexie).
2. Si la aplicación se cierra, al volver a abrir, el `SyncQueueWorker` (iniciado en `SyncEngine`) leerá todos los registros en estado `PENDING` o `ERROR`.
3. El worker los procesará en orden de creación (`createdAt`), garantizando que si el usuario "Oró" y luego "Canceló", el servidor reciba las acciones en el mismo orden.
