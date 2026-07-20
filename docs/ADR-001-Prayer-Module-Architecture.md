# ADR 001: Arquitectura del Módulo de Oraciones (REST + Outbox)

## Contexto
KADOSH utiliza una arquitectura basada en **Event Sourcing** con proyección en el cliente y un motor de sincronización (`SyncEngine`) para garantizar consistencia Offline-First y Cifrado Extremo a Extremo (E2EE) en los datos financieros personales.

El módulo de **Oraciones** se implementó inicialmente intentando reutilizar esta misma maquinaria (`PrayerCommandDispatcher` -> `WorkspaceEvent`). 

## Problema
Al intentar adaptar Event Sourcing para datos comunitarios, se evidenciaron problemas críticos:
1. **Split-Brain de IDs:** Para evitar que `SyncEngine` rechace eventos sin un Workspace E2EE válido, el frontend utilizaba `PrayerCommandDispatcher` localmente (generando un UUID en Dexie) y al mismo tiempo hacía un `POST` a la API REST (Prisma generaba un UUID distinto).
2. **Desincronización Total:** Como las acciones locales intentaban referenciar el UUID local (que no existía en el servidor), las cancelaciones e interacciones fallaban silenciosamente, arrojando errores 404 o "Petición no encontrada" en el dominio.
3. **Escalabilidad (El problema de fondo):** Mantener un Event Store comunitario (donde el cliente deba descargar todos los eventos de todos los usuarios para proyectar el estado) destruiría la memoria de Dexie y el ancho de banda. Los modelos de Event Sourcing local son inviables para contextos públicos ilimitados.

## Decisión
Se decide que el módulo de Oraciones sea una **excepción arquitectónica explícita** dentro de KADOSH. 

- **Sin Event Sourcing:** El módulo no despachará comandos ni eventos.
- **REST First:** Se comunicará con Supabase/Prisma mediante una API REST convencional.
- **Prisma = Fuente de Verdad:** El servidor calculará el estado real de la comunidad.
- **Outbox Pattern (SyncQueue):** Para no perder la capacidad **Offline-First**, el frontend guardará el registro en Dexie e insertará un trabajo en la tabla `SyncQueue`. Un worker en segundo plano se encargará de intentar procesar la cola contra la API REST.

## Beneficios
- Un solo identificador (UUID) generado por el cliente, compartido por Dexie, SyncQueue, y Prisma.
- Escalabilidad: El servidor pagina y filtra; el cliente no tiene que descargar la base de datos de todos los usuarios.
- Simplicidad: Menos abstracciones innecesarias para un CRUD público.

## Limitaciones
- Pierde la auditoría total de tiempo (journaling) que ofrece Event Sourcing. (Asumible para una petición de oración).
- Rompe con la homogeneidad del código en la capa de persistencia (requiere manejar SyncQueue de forma paralela al SyncEngine).

## Uso Futuro de este Patrón
Este patrón (`REST + SyncQueue Outbox`) deberá reutilizarse en **cualquier futura funcionalidad de KADOSH que sea de ámbito comunitario o público**, que no pertenezca a un Workspace privado, que no requiera E2EE y cuyo volumen total de datos exceda la capacidad de almacenamiento óptimo del dispositivo del usuario (ej. foros, chat global, perfiles públicos).
