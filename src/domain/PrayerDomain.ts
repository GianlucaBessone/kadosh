import { v4 as uuidv4 } from 'uuid';
import { PrayerCommand } from './commands/PrayerCommands';
import { PrayerEvent } from './events/PrayerEvents';

interface PrayerState {
  requests: Record<string, any>;
  interactions: Record<string, any>;
}

export class PrayerDomain {
  public static process(command: PrayerCommand, currentState: PrayerState): PrayerEvent {
    const timestamp = new Date().toISOString();
    const eventId = uuidv4();
    const requests = currentState.requests || {};
    const interactions = currentState.interactions || {};

    switch (command.type) {
      case 'CREATE_PRAYER_REQUEST': {
        const message = command.payload.message?.trim();
        if (!message) {
          throw new Error('El mensaje no puede estar vacío');
        }
        if (message.length > 500) {
          throw new Error('El mensaje no puede superar 500 caracteres');
        }

        return {
          type: 'PrayerRequestCreated',
          metadata: {
            eventId,
            timestamp,
            version: 'v1',
            aggregateId: command.payload.prayerRequestId,
            aggregateType: 'PrayerRequest'
          },
          payload: {
            ...command.payload,
            createdAt: timestamp
          }
        };
      }

      case 'PRAY_FOR_REQUEST': {
        const request = requests[command.payload.prayerRequestId];
        if (!request) {
          throw new Error('Petición no encontrada');
        }

        if (request.userId === command.payload.userId) {
          throw new Error('No puedes orar por tu propia petición');
        }

        const requestExpiresAt = new Date(request.expiresAt);
        if (request.expiresAt && requestExpiresAt <= new Date()) {
          throw new Error('Esta petición ya no está activa');
        }

        const interactionKey = `${command.payload.prayerRequestId}:${command.payload.userId}`;
        if (interactions[interactionKey]) {
          throw new Error('Ya has orado por esta petición');
        }

        return {
          type: 'PrayerInteractionCreated',
          metadata: {
            eventId,
            timestamp,
            version: 'v1',
            aggregateId: command.payload.interactionId,
            aggregateType: 'PrayerInteraction'
          },
          payload: {
            ...command.payload,
            createdAt: timestamp
          }
        };
      }

      default:
        throw new Error('Command not recognized in PrayerDomain');
    }
  }
}
