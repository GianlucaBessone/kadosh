import { v4 as uuidv4 } from 'uuid';
import { FinanceCommand } from './commands/FinanceCommands';
import { FinanceEvent } from './events/FinanceEvents';

export class FinanceDomain {
  
  /**
   * Procesa un FinanceCommand y retorna un FinanceEvent puro.
   * La validación de negocio ocurre aquí.
   * No tiene efectos secundarios (IO, DB, Crypto).
   */
  public static process(command: FinanceCommand, currentState: any): FinanceEvent {
    const timestamp = new Date().toISOString();
    const eventId = uuidv4();
    
    switch (command.type) {
      case 'CREATE_ACCOUNT':
        if (command.payload.initialBalance < 0) {
          throw new Error('Initial balance cannot be negative');
        }
        return {
          type: 'AccountCreated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.accountId, aggregateType: 'Account' },
          payload: command.payload
        };
        
      case 'UPDATE_ACCOUNT':
        return {
          type: 'AccountUpdated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.accountId, aggregateType: 'Account' },
          payload: command.payload
        };

      case 'DELETE_ACCOUNT':
        return {
          type: 'AccountDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.accountId, aggregateType: 'Account' },
          payload: command.payload
        };

      case 'CREATE_TRANSACTION':
        if (command.payload.amount <= 0) {
          throw new Error('Transaction amount must be strictly positive');
        }
        return {
          type: 'TransactionCreated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.transactionId, aggregateType: 'Transaction' },
          payload: command.payload
        };
        
      case 'UPDATE_TRANSACTION':
        return {
          type: 'TransactionUpdated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.transactionId, aggregateType: 'Transaction' },
          payload: command.payload
        };

      case 'DELETE_TRANSACTION':
        return {
          type: 'TransactionDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.transactionId, aggregateType: 'Transaction' },
          payload: command.payload
        };

      case 'CREATE_CATEGORY':
        return {
          type: 'CategoryCreated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.categoryId, aggregateType: 'Category' },
          payload: command.payload
        };

      case 'DELETE_CATEGORY':
        return {
          type: 'CategoryDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.categoryId, aggregateType: 'Category' },
          payload: command.payload
        };

      case 'CREATE_COMMITMENT':
        if (command.payload.amount <= 0) {
          throw new Error('Commitment amount must be strictly positive');
        }
        return {
          type: 'CommitmentCreated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.commitmentId, aggregateType: 'Commitment' },
          payload: command.payload
        };

      case 'UPDATE_COMMITMENT':
        return {
          type: 'CommitmentUpdated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.commitmentId, aggregateType: 'Commitment' },
          payload: command.payload
        };

      case 'DELETE_COMMITMENT':
        return {
          type: 'CommitmentDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.commitmentId, aggregateType: 'Commitment' },
          payload: command.payload
        };

      case 'PAY_COMMITMENT':
        return {
          type: 'CommitmentPaid',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.commitmentId, aggregateType: 'Commitment' },
          payload: command.payload
        };

      case 'DELETE_PAYMENT':
        return {
          type: 'PaymentDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.commitmentId, aggregateType: 'Commitment' },
          payload: command.payload
        };

      case 'REGISTER_TITHE':
        if (command.payload.amount <= 0) {
          throw new Error('Tithe amount must be positive');
        }
        return {
          type: 'TitheRegistered',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.titheId, aggregateType: 'Tithe' },
          payload: command.payload
        };

      case 'PLANT_SEED':
        if (command.payload.targetAmount <= 0) {
          throw new Error('Seed target amount must be positive');
        }
        return {
          type: 'SeedGoalCreated',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };

      case 'WATER_SEED':
        if (command.payload.amount <= 0) {
          throw new Error('Water amount must be strictly positive');
        }
        return {
          type: 'SeedWatered',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };

      case 'WITHDRAW_SEED':
        if (command.payload.amount <= 0) {
          throw new Error('Withdraw amount must be strictly positive');
        }
        return {
          type: 'SeedWithdrawn',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };

      case 'DELETE_SEED':
        return {
          type: 'SeedDeleted',
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };

      case 'HARVEST_SEED':
        return {
          type: 'SeedGoalDeleted', // For now map to deleted/harvested
          metadata: { eventId, timestamp, version: 'v1', aggregateId: command.payload.seedId, aggregateType: 'SeedGoal' },
          payload: command.payload
        };

      default:
        throw new Error(`Command not recognized in FinanceDomain`);
    }
  }
}


