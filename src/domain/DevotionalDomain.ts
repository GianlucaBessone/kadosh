import { v4 as uuidv4 } from 'uuid';
import { DevotionalCommand } from './commands/DevotionalCommands';
import { DevotionalEvent } from './events/DevotionalEvents';

export class DevotionalDomain {
  
  /**
   * Procesa un DevotionalCommand y retorna un DevotionalEvent puro.
   */
  public static process(command: DevotionalCommand, currentState: any): DevotionalEvent {
    const timestamp = new Date().toISOString();
    const eventId = uuidv4();
    
    switch (command.type) {
      case 'REGISTER_TITHE':
        if (command.payload.amount <= 0) {
          throw new Error('Tithe amount must be positive');
        }
        return {
          type: 'TitheRegistered',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.titheId, aggregateType: 'Tithe' },
          payload: command.payload
        };
        
      case 'DELETE_TITHE':
        if (!currentState.tithes || !currentState.tithes[command.payload.titheId]) {
          throw new Error('Tithe does not exist');
        }
        return {
          type: 'TitheDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.titheId, aggregateType: 'Tithe' },
          payload: command.payload
        };

      case 'CREATE_SEED_GOAL':
        if (command.payload.targetAmount <= 0) {
          throw new Error('Target amount must be strictly positive');
        }
        return {
          type: 'SeedGoalCreated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };
        
      case 'ADD_SEED_CONTRIBUTION':
        if (command.payload.amount <= 0) {
          throw new Error('Contribution amount must be strictly positive');
        }
        if (!currentState.seeds || !currentState.seeds[command.payload.seedId]) {
          throw new Error('Seed goal does not exist');
        }
        return {
          type: 'SeedWatered',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };

      case 'DELETE_SEED_GOAL':
        if (!currentState.seeds || !currentState.seeds[command.payload.seedId]) {
          throw new Error('Seed goal does not exist');
        }
        return {
          type: 'SeedGoalDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };

      default:
        throw new Error(`Command not recognized in DevotionalDomain`);
    }
  }
}
