import { v4 as uuidv4 } from 'uuid';
import { db, WorkspaceEvent } from '@/lib/db';
import { CryptoService } from '@/lib/crypto/CryptoService';
import { WorkspaceEventRepository } from '../repositories/WorkspaceEventRepository';
import { PrayerDomain } from '../PrayerDomain';
import { PrayerCommand } from './PrayerCommands';

export class PrayerCommandDispatcher {
  public static async dispatch(command: PrayerCommand): Promise<void> {
    const { workspaceId: originalWorkspaceId, userId, deviceId } = command.metadata;
    
    // Usar un workspaceId predeterminado si es nulo para evitar problemas de tipo
    // Para peticiones comunitarias, usamos un workspace especial
    const workspaceId = originalWorkspaceId || 'COMMUNITY';
    
    // Buscar en todas las peticiones, no solo en un workspace específico
    // para permitir el manejo de peticiones comunitarias (sin workspace)
    let requests;
    if (originalWorkspaceId && originalWorkspaceId !== 'COMMUNITY') {
      requests = await db.prayerRequests.where('workspaceId').equals(originalWorkspaceId).toArray();
    } else {
      // Para peticiones comunitarias, buscar todas las que no tengan workspace o sean COMMUNITY
      requests = await db.prayerRequests.filter(req => 
        req.workspaceId === null || req.workspaceId === 'COMMUNITY'
      ).toArray();
    }
    
    const interactions = await db.prayerInteractions.toArray();

    const requestMap = Object.fromEntries(requests.map((request) => [request.id, request]));
    const interactionMap = Object.fromEntries(
      interactions.map((interaction) => [`${interaction.prayerRequestId}:${interaction.userId}`, interaction])
    );

    const state = {
      requests: requestMap,
      interactions: interactionMap
    };

    const event = PrayerDomain.process(command, state);

    let workspaceKeyInfo;
    try {
      if (originalWorkspaceId && originalWorkspaceId !== 'COMMUNITY') {
        workspaceKeyInfo = await CryptoService.getActiveWorkspaceKey(originalWorkspaceId);
      } else {
        // Para peticiones comunitarias, intentar obtener alguna clave válida o usar una por defecto
        workspaceKeyInfo = await CryptoService.getActiveWorkspaceKey(workspaceId);
      }
    } catch {
      // Si no se encuentra clave de workspace, continuar sin cifrado específico
      workspaceKeyInfo = null;
    }

    const payloadString = JSON.stringify(event.payload);
    let encryptedPayload = payloadString; // Valor por defecto sin cifrado
    
    if (workspaceKeyInfo) {
      encryptedPayload = await CryptoService.encryptPayload(payloadString, workspaceKeyInfo.key);
    } else {
      // Para peticiones comunitarias sin workspace, no aplicar cifrado de workspace
      console.log('Procesando petición comunitaria sin cifrado de workspace');
    }

    let nextSequence = 1;
    if (originalWorkspaceId && originalWorkspaceId !== 'COMMUNITY') {
      nextSequence = await WorkspaceEventRepository.getNextSequence(originalWorkspaceId);
    }

    const workspaceEvent: WorkspaceEvent = {
      id: event.metadata.eventId,
      eventType: event.type,
      workspaceId: originalWorkspaceId || 'COMMUNITY', // Usar string en lugar de null
      aggregateId: event.metadata.aggregateId,
      aggregateType: event.metadata.aggregateType,
      sequence: nextSequence,
      ownerUserId: userId,
      deviceId: deviceId,
      keyId: workspaceKeyInfo?.id || 'SYSTEM_KEY', // Usar string en lugar de null
      encryptionVersion: 'v1',
      schemaVersion: '1.0',
      encryptedPayload,
      createdAt: event.metadata.timestamp,
      syncStatus: 'PENDING'
    };

    await WorkspaceEventRepository.saveEvent(workspaceEvent);

    // Procesar inmediatamente la proyección local para que el evento se refleje inmediatamente
    // Esto es importante para la experiencia del usuario
    if (event.type === 'PrayerRequestCreated') {
      const payload = event.payload;
      await db.prayerRequests.add({
        id: payload.prayerRequestId,
        workspaceId: payload.workspaceId || 'COMMUNITY', // Usar string en lugar de null
        userId: payload.userId,
        message: payload.message,
        status: 'ACTIVE',
        prayerCount: 0,
        createdAt: payload.createdAt,
        updatedAt: payload.createdAt,
        expiresAt: payload.expiresAt,
        archivedAt: null
      });
    } else if (event.type === 'PrayerInteractionCreated') {
      const payload = event.payload;
      await db.prayerInteractions.add({
        id: payload.interactionId,
        prayerRequestId: payload.prayerRequestId,
        userId: payload.userId,
        createdAt: payload.createdAt
      });

      // Actualizar el conteo de oraciones en la petición correspondiente
      const request = await db.prayerRequests.get(payload.prayerRequestId);
      if (request) {
        await db.prayerRequests.update(payload.prayerRequestId, {
          prayerCount: (request.prayerCount || 0) + 1,
          updatedAt: payload.createdAt
        });
      }
    }
  }
}