import { v4 as uuidv4 } from 'uuid';
import { WorkspaceEventRepository } from '../../domain/repositories/WorkspaceEventRepository';
import { CryptoService } from './CryptoService';
import { useWorkspaceStore } from '../../store/WorkspaceStore';
import { EventBus } from '../events/EventBus';
import { WorkspaceSnapshot } from '../db';
import { initialWorkspaceState, workspaceRootReducer } from './reducers/WorkspaceRootReducer';
import { WorkspaceState } from '../../store/types/WorkspaceState';

export class SnapshotManager {
  private static readonly SNAPSHOT_THRESHOLD = 100; // Crear snapshot cada 100 eventos

  /**
   * Carga el estado de un Workspace. 
   * Flujo: Snapshot (descifrado) -> Event Replay (descifrados) -> Store
   */
  public static async loadWorkspace(workspaceId: string): Promise<void> {
    try {
      // 1. Obtener el último Snapshot
      const latestSnapshot = await WorkspaceEventRepository.getLatestSnapshot(workspaceId);
      
      let baseState: WorkspaceState = { ...initialWorkspaceState, id: workspaceId };
      let lastEventTimestamp: string | undefined = undefined;

      if (latestSnapshot) {
        // 2. Descifrar el Snapshot
        const workspaceKey = await CryptoService.getActiveWorkspaceKey(workspaceId);
        const decryptedPayload = await CryptoService.decryptPayload(
          latestSnapshot.encryptedPayload,
          workspaceKey.key
        );
        
        baseState = JSON.parse(decryptedPayload) as WorkspaceState;
        lastEventTimestamp = latestSnapshot.createdAt; // Solo cargar eventos posteriores a este timestamp
      }

      // 3. Obtener eventos diferenciales (posteriores al snapshot)
      const differentialEvents = await WorkspaceEventRepository.getEventsAfter(workspaceId, lastEventTimestamp);

      // 4. Descifrar y reproducir eventos puros (Event Replay)
      let currentState = baseState;
      
      for (const encryptedEvent of differentialEvents) {
        const workspaceKey = await CryptoService.getActiveWorkspaceKey(workspaceId);
        const decryptedPayloadString = await CryptoService.decryptPayload(
          encryptedEvent.encryptedPayload,
          workspaceKey.key
        );
        
        const pureEvent = JSON.parse(decryptedPayloadString);
        
        // Reducir estado puramente
        currentState = workspaceRootReducer(currentState, pureEvent);
      }

      // 5. Inyectar estado consolidado en Zustand
      useWorkspaceStore.getState().initializeWorkspace(workspaceId, currentState);
      useWorkspaceStore.getState().setActiveWorkspace(workspaceId);

      EventBus.emit('workspace.snapshot.loaded', workspaceId);

    } catch (error) {
      console.error(`Error loading workspace ${workspaceId}:`, error);
      throw new Error(`Failed to load workspace state: ${error}`);
    }
  }

  /**
   * Verifica si es necesario generar un snapshot basado en políticas.
   */
  public static async checkAndGenerateSnapshot(workspaceId: string): Promise<void> {
    const latestSnapshot = await WorkspaceEventRepository.getLatestSnapshot(workspaceId);
    const lastTimestamp = latestSnapshot?.createdAt || new Date(0).toISOString();

    const newEventsCount = await WorkspaceEventRepository.countEventsAfter(workspaceId, lastTimestamp);

    if (newEventsCount >= this.SNAPSHOT_THRESHOLD) {
      await this.generateSnapshot(workspaceId, latestSnapshot ? latestSnapshot.snapshotVersion + 1 : 1);
    }
  }

  /**
   * Genera un Snapshot cifrado a partir del estado en memoria y lo persiste.
   */
  public static async generateSnapshot(workspaceId: string, newVersion: number): Promise<void> {
    const state = useWorkspaceStore.getState().workspaces[workspaceId];
    if (!state) return; // Nada que guardar

    const payloadString = JSON.stringify(state);
    
    // Obtener la llave primaria activa del Workspace
    const workspaceKey = await CryptoService.getActiveWorkspaceKey(workspaceId);
    if (!workspaceKey) throw new Error("No active WorkspaceKey available for snapshot");

    const encryptedPayload = await CryptoService.encryptPayload(payloadString, workspaceKey.key);

    const snapshot: WorkspaceSnapshot = {
      id: uuidv4(),
      workspaceId: workspaceId,
      snapshotVersion: newVersion,
      schemaVersion: "1.0",
      lastEventId: '00000000-0000-0000-0000-000000000000', // Podría rastrearse el ID exacto del último evento procesado
      keyId: workspaceKey.id,
      encryptedPayload,
      createdAt: new Date().toISOString(),
      eventCount: 0,
      snapshotPolicy: 'AUTO',
      createdByDeviceId: 'system'
    };

    await WorkspaceEventRepository.saveSnapshot(snapshot);
    EventBus.emit('workspace.snapshot.created', snapshot.id);
  }
}
