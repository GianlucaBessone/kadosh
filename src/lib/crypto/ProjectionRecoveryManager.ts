import { db } from '@/lib/db';
import { ProjectionPipeline } from './ProjectionPipeline';
import { ProjectionLogger } from './ProjectionLogger';

export class ProjectionRecoveryManager {
  private static retryTimer: NodeJS.Timeout | null = null;
  private static readonly RETRY_INTERVAL_MS = 60000; // 1 minute fallback

  static init() {
    if (typeof window === 'undefined') return;

    // Primary triggers
    window.addEventListener('online', () => this.triggerRecovery('Network Online'));
    window.addEventListener('workspace-events-updated', () => this.triggerRecovery('New Events Synced'));
    window.addEventListener('workspace-key-loaded', () => this.triggerRecovery('Key Loaded'));

    // Secondary fallback
    this.retryTimer = setInterval(() => {
      this.triggerRecovery('Fallback Timer');
    }, this.RETRY_INTERVAL_MS);
  }

  static async triggerRecovery(reason: string) {
    try {
      const workspaces = await db.workspaces.toArray();

      for (const ws of workspaces) {
        const health = await db.projectionHealth.get(ws.id);
        
        if (!health) {
          // No health record yet, try to run
          await ProjectionPipeline.run(ws.id);
          continue;
        }

        switch (health.status) {
          case 'PAUSED':
          case 'WAITING_KEY':
          case 'RETRYING':
          case 'FAILED':
            ProjectionLogger.info(`Intentando recuperación para workspace ${ws.id} (Razón: ${reason})`);
            await db.projectionHealth.update(ws.id, { status: 'RECOVERING', updatedAt: new Date().toISOString() });
            
            try {
              await ProjectionPipeline.run(ws.id);
            } catch (e) {
              // If it fails again, the Pipeline will have already set the health status back to FAILED/PAUSED etc.
              ProjectionLogger.warn(`Recuperación fallida para workspace ${ws.id}`);
            }
            break;
          
          case 'OK':
          case 'PROCESSING':
          case 'RECOVERING':
            // In these states, a normal run is fine. Pipeline Mutex will protect it.
            await ProjectionPipeline.run(ws.id);
            break;
        }
      }

      // Also process Dead Letter Queue (non-critical events)
      await this.processDLQ();

    } catch (e) {
      ProjectionLogger.error('Fallo en ProjectionRecoveryManager', e);
    }
  }

  private static async processDLQ() {
    const quarantined = await db.projectionDeadLetters
      .where('status').equals('QUARANTINED')
      .toArray();

    for (const dlq of quarantined) {
      // Exponential backoff or simple retry logic
      if (dlq.retries < 3) {
        // Try to re-process just this event? 
        // Wait, DLQ events are non-critical. Processing them means we need a way to run a single event.
        // For now, we just mark them as DISCARDED if max retries reached, or we could leave them for manual intervention.
        if (dlq.retries >= 2) {
          await db.projectionDeadLetters.update(dlq.eventId, { 
            status: 'DISCARDED', 
            lastFailure: new Date().toISOString() 
          });
          ProjectionLogger.warn(`DLQ Evento ${dlq.eventId} descartado tras múltiples intentos.`);
        } else {
          // Increment retry count
          await db.projectionDeadLetters.update(dlq.eventId, { 
            retries: dlq.retries + 1,
            lastFailure: new Date().toISOString()
          });
        }
      }
    }
  }
}
