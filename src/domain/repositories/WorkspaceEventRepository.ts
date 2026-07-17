import Dexie from 'dexie';
import { db, WorkspaceEvent, WorkspaceSnapshot } from '../../lib/db';
import { EventBus } from '../../lib/events/EventBus';

export class WorkspaceEventRepository {
  
  /**
   * Guarda un evento cifrado en el almacén local y emite el evento global.
   */
  public static async saveEvent(event: WorkspaceEvent): Promise<void> {
    await db.workspaceEvents.add(event);
    
    // Al guardar un nuevo evento, notificamos al sistema
    // El SyncEngine y el ProjectionEngine reaccionarán a esto
    EventBus.emit('workspace.events.changed', [event]);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workspace-events-updated'));
    }
  }

  /**
   * Recupera todos los eventos de un Workspace, opcionalmente a partir de una fecha/hora.
   * Utilizado durante el Event Replay.
   */
  public static async getEventsAfter(workspaceId: string, timestamp?: string): Promise<WorkspaceEvent[]> {
    let collection = db.workspaceEvents.where('workspaceId').equals(workspaceId);
    
    // Sort and filter in memory since we don't have a compound index for workspaceId + createdAt
    const events = await collection.toArray();
    
    let filteredEvents = events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    if (timestamp) {
      filteredEvents = filteredEvents.filter(e => new Date(e.createdAt).getTime() > new Date(timestamp).getTime());
    }
    
    return filteredEvents;
  }

  /**
   * Cuenta cuántos eventos existen en el Workspace desde el último snapshot.
   * Útil para evaluar políticas de Snapshot.
   */
  public static async countEventsAfter(workspaceId: string, timestamp: string): Promise<number> {
    const events = await this.getEventsAfter(workspaceId, timestamp);
    return events.length;
  }

  /**
   * Guarda un nuevo Snapshot cifrado en la base de datos local.
   */
  public static async saveSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
    await db.workspaceSnapshots.add(snapshot);
  }

  /**
   * Obtiene el último Snapshot registrado para un Workspace.
   */
  public static async getLatestSnapshot(workspaceId: string): Promise<WorkspaceSnapshot | undefined> {
    const snapshots = await db.workspaceSnapshots
      .where('workspaceId')
      .equals(workspaceId)
      .toArray();

    // Devolver el más reciente
    if (snapshots.length === 0) return undefined;
    return snapshots.sort((a, b) => b.snapshotVersion - a.snapshotVersion)[0];
  }

  /**
   * Obtiene el próximo sequence disponible para el Workspace.
   * Útil para asegurar orden estricto de eventos localmente.
   */
  public static async getNextSequence(workspaceId: string): Promise<number> {
    // Para no traer todos los eventos, podemos ordenar por workspaceId+sequence descending
    // y tomar el primero, usando el índice '[workspaceId+sequence]'.
    const lastEvent = await db.workspaceEvents
      .where('[workspaceId+sequence]')
      .between([workspaceId, Dexie.minKey], [workspaceId, Dexie.maxKey])
      .reverse()
      .first();
      
    return lastEvent ? lastEvent.sequence + 1 : 1;
  }
}
