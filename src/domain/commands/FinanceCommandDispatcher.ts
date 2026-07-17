import { FinanceCommand } from './FinanceCommands';
import { FinanceDomain } from '../FinanceDomain';
import { useWorkspaceStore } from '../../store/WorkspaceStore';
import { WorkspaceEventRepository } from '../repositories/WorkspaceEventRepository';
import { CryptoService } from '../../lib/crypto/CryptoService';
import { db, WorkspaceEvent } from '../../lib/db';
import { EventBus } from '../../lib/events/EventBus';

export class FinanceCommandDispatcher {
  /**
   * Despacha un comando financiero.
   * 1. Recupera el estado actual del Workspace.
   * 2. Procesa el comando a través del Dominio Puro.
   * 3. Cifra el Payload del evento resultante.
   * 4. Persiste el Evento Cifrado en la base de datos local.
   * 5. El EventRepository emitirá el evento global para sincronización y actualización del UI.
   */
  public static async dispatch(command: FinanceCommand): Promise<void> {
    const { workspaceId, userId, deviceId } = command.metadata;
    
    // 1. Obtener estado actual desde Read Models para validaciones (CQRS)
    const [accounts, transactions, categories, commitments, tithes, seeds] = await Promise.all([
      db.accounts.where('workspaceId').equals(workspaceId).toArray(),
      db.transactions.where('workspaceId').equals(workspaceId).toArray(),
      db.categories.where('workspaceId').equals(workspaceId).toArray(),
      db.financialCommitments.where('ownerId').equals(workspaceId).toArray(),
      db.tithes.where('workspaceId').equals(workspaceId).toArray(),
      db.seedGoals.where('workspaceId').equals(workspaceId).toArray(),
    ]);

    const stateFinances = {
      accounts: Object.fromEntries(accounts.map(a => [a.id, a])),
      transactions: Object.fromEntries(transactions.map(t => [t.id, t])),
      categories: Object.fromEntries(categories.map(c => [c.id, c])),
      commitments: Object.fromEntries(commitments.map(c => [c.id, c])),
      tithes: Object.fromEntries(tithes.map(t => [t.id, t])),
      seeds: Object.fromEntries(seeds.map(s => [s.id, s])),
    };

    // 2. Procesar el comando (Business Logic -> Pure Event)
    const event = FinanceDomain.process(command, stateFinances);

    // 3. Obtener llave simétrica del Workspace
    const workspaceKeyInfo = await CryptoService.getActiveWorkspaceKey(workspaceId);
    if (!workspaceKeyInfo) {
      throw new Error(`No active WorkspaceKey available for workspace ${workspaceId}`);
    }

    // 4. Cifrar el payload del evento puro
    const payloadString = JSON.stringify(event.payload);
    const encryptedPayload = await CryptoService.encryptPayload(payloadString, workspaceKeyInfo.key);

    // 5. Construir el WorkspaceEvent cifrado
    const nextSequence = await WorkspaceEventRepository.getNextSequence(workspaceId);

    const workspaceEvent: WorkspaceEvent = {
      id: event.metadata.eventId,
      eventType: event.type,
      workspaceId: workspaceId,
      aggregateId: event.metadata.aggregateId,
      aggregateType: event.metadata.aggregateType,
      sequence: nextSequence,
      ownerUserId: userId,
      deviceId: deviceId, // Or fetched from local auth/device info
      keyId: workspaceKeyInfo.id,
      encryptionVersion: 'v1',
      schemaVersion: '1.0',
      encryptedPayload,
      createdAt: event.metadata.timestamp,
      syncStatus: 'PENDING'
    };

    // 6. Guardar y notificar al SyncEngine y ProjectionEngine (vía eventos en Repository)
    await WorkspaceEventRepository.saveEvent(workspaceEvent);
  }
}
