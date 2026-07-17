import Dexie from 'dexie';
import { db } from '@/lib/db';
import { CryptoService } from './CryptoService';
import { StateReducer, ParsedEvent } from './StateReducer';
import { ProjectionLogger } from './ProjectionLogger';
import { ProjectionMutex } from './ProjectionMutex';
import { 
  ProjectionGapError, 
  ProjectionCryptoError, 
  ProjectionValidationError,
  ProjectionIdempotencyError,
  ProjectionReducerError
} from './ProjectionErrors';
import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { PerformanceReporter } from '@/lib/performance/PerformanceReporter';

export class ProjectionPipeline {
  
  static async run(workspaceId: string): Promise<void> {
    if (!ProjectionMutex.acquire(workspaceId)) {
      ProjectionLogger.info(`Proyección ya en curso para workspace ${workspaceId}. Ignorando.`);
      return;
    }

    try {
      await this.setHealth(workspaceId, 'PROCESSING');
      
      let hasMore = true;
      let didUpdate = false;

      while (hasMore) {
        hasMore = false;

        // Stage 1.1: Obtener estado actual (Solo Lectura)
        const projState = await db.projectionState.get(workspaceId);
        const lastSeq = projState ? projState.lastProjectedSequence : 0;

        // Límite de lote para no saturar memoria
        const BATCH_SIZE = 500;
        const unprojectedEvents = await db.workspaceEvents
          .where('[workspaceId+sequence]')
          .between([workspaceId, lastSeq + 1], [workspaceId, Dexie.maxKey])
          .limit(BATCH_SIZE)
          .toArray();

        if (unprojectedEvents.length === 0) {
          break;
        }

        hasMore = true; // Loop again to catch events added during processing
        didUpdate = true;

        // Stage 1.2: Validar Secuencia (Gap Detection)
        unprojectedEvents.sort((a, b) => a.sequence - b.sequence);
        let currentSeq = lastSeq;
        for (const ev of unprojectedEvents) {
          if (ev.sequence !== currentSeq + 1) {
            throw new ProjectionGapError(currentSeq + 1, ev.sequence);
          }
          currentSeq = ev.sequence;
        }

        // Stage 2: Decryption & Stage 3: Validation
        const parsedEvents: ParsedEvent[] = [];
        let keyStr: CryptoKey;
        try {
          const { key } = await CryptoService.getActiveWorkspaceKey(workspaceId);
          keyStr = key;
        } catch (error) {
          await this.setHealth(workspaceId, 'WAITING_KEY', 'Llave de Workspace no disponible');
          ProjectionMutex.release(workspaceId);
          return;
        }

        PerformanceMonitor.start(`crypto_decrypt_batch_${workspaceId}`);
        for (const ev of unprojectedEvents) {
          try {
            const decryptedJson = await CryptoService.decryptPayload(ev.encryptedPayload, keyStr);
            
            // Generate checksum
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(decryptedJson));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const payloadChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const payload = JSON.parse(decryptedJson);
            
            if (!payload || !ev.eventType) {
              throw new ProjectionValidationError(ev.id, 'Payload JSON malformado o sin eventType');
            }

            parsedEvents.push({
              id: ev.id,
              workspaceId,
              eventType: ev.eventType,
              sequence: ev.sequence,
              timestamp: new Date(ev.createdAt).getTime(),
              payloadChecksum,
              payload
            });
          } catch (e: any) {
            if (e instanceof ProjectionValidationError) throw e;
            throw new ProjectionCryptoError(ev.id, e.message);
          }
        }
        const cryptoDuration = PerformanceMonitor.end(`crypto_decrypt_batch_${workspaceId}`);
        if (cryptoDuration !== null) {
          PerformanceReporter.record({
            name: 'ProjectionPipeline.crypto_decrypt_batch',
            category: 'crypto',
            duration: cryptoDuration,
            details: { batchSize: unprojectedEvents.length }
          });
        }

        // Stage 4: Atomic Projection
        if (parsedEvents.length > 0) {
          PerformanceMonitor.start(`projection_reduce_batch_${workspaceId}`);
          const maxSeq = parsedEvents[parsedEvents.length - 1].sequence;
          await StateReducer.reduceAndPersist(workspaceId, parsedEvents, maxSeq);
          const reduceDuration = PerformanceMonitor.end(`projection_reduce_batch_${workspaceId}`);
          if (reduceDuration !== null) {
            PerformanceReporter.record({
              name: 'ProjectionPipeline.reduceAndPersist',
              category: 'projection',
              duration: reduceDuration,
              details: { eventsCount: parsedEvents.length }
            });
          }
        }
      }

      await this.setHealth(workspaceId, 'OK');

      if (didUpdate) {
        window.dispatchEvent(new CustomEvent('projections-ready', { detail: { workspaceId } }));
      }

    } catch (error: any) {
      if (error instanceof ProjectionGapError) {
        ProjectionLogger.warn(`Gap detectado en workspace ${workspaceId}: ${error.message}`);
        await this.setHealth(workspaceId, 'PAUSED', error.message);
      } else if (error instanceof ProjectionCryptoError) {
        ProjectionLogger.error(`Error Criptográfico en workspace ${workspaceId}: ${error.message}`);
        await this.setHealth(workspaceId, 'FAILED', error.message);
      } else if (error instanceof ProjectionValidationError) {
        ProjectionLogger.critical(`Error de Validación en workspace ${workspaceId}: ${error.message}`);
        await this.setHealth(workspaceId, 'FAILED', error.message);
      } else if (error instanceof ProjectionIdempotencyError) {
        ProjectionLogger.critical(`Error de Idempotencia en workspace ${workspaceId}: ${error.message}`);
        await this.setHealth(workspaceId, 'FAILED', error.message);
      } else if (error instanceof ProjectionReducerError) {
        ProjectionLogger.critical(`Fallo de Reducer Crítico en workspace ${workspaceId}: ${error.message}`);
        await this.setHealth(workspaceId, 'FAILED', error.message);
      } else {
        ProjectionLogger.critical(`Error inesperado en ProjectionPipeline (${workspaceId}): ${error.message}`);
        await this.setHealth(workspaceId, 'FAILED', error.message);
      }
      
      // Stop the pipeline on any error above to prevent moving cursor
      throw error;
    } finally {
      ProjectionMutex.release(workspaceId);
    }
  }

  private static async setHealth(workspaceId: string, status: any, lastError: string | null = null) {
    try {
      await db.projectionHealth.put({
        workspaceId,
        status,
        lastError,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('No se pudo escribir projectionHealth', e);
    }
  }
}
