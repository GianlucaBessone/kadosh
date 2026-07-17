import { DevotionalEvent } from '../../../domain/events/DevotionalEvents';
import { DevotionalState, Tithe, SeedGoal } from '../../../store/types/WorkspaceState';

export const initialDevotionalState: DevotionalState = {
  tithes: {},
  seeds: {}
};

export function devotionalReducer(state: DevotionalState = initialDevotionalState, event: DevotionalEvent): DevotionalState {
  switch (event.type) {
    case 'TitheRegistered': {
      const tithe: Tithe = {
        id: event.payload.titheId,
        amount: event.payload.amount,
        month: event.payload.month,
        year: event.payload.year,
        transactionId: event.payload.transactionId
      };
      return {
        ...state,
        tithes: { ...state.tithes, [tithe.id]: tithe }
      };
    }

    case 'TitheDeleted': {
      const newTithes = { ...state.tithes };
      delete newTithes[event.payload.titheId];
      return { ...state, tithes: newTithes };
    }

    case 'SeedGoalCreated': {
      const seed: SeedGoal = {
        id: event.payload.seedId,
        name: event.payload.name,
        targetAmount: event.payload.targetAmount,
        deadline: event.payload.deadline,
        currentAmount: 0
      };
      return {
        ...state,
        seeds: { ...state.seeds, [seed.id]: seed }
      };
    }

    case 'SeedWatered': {
      const seed = state.seeds[event.payload.seedId];
      if (!seed) return state;

      return {
        ...state,
        seeds: {
          ...state.seeds,
          [seed.id]: {
            ...seed,
            currentAmount: seed.currentAmount + event.payload.amount
          }
        }
      };
    }

    case 'SeedWithdrawn': {
      const seed = state.seeds[event.payload.seedId];
      if (!seed) return state;

      return {
        ...state,
        seeds: {
          ...state.seeds,
          [seed.id]: {
            ...seed,
            currentAmount: Math.max(0, seed.currentAmount - event.payload.amount)
          }
        }
      };
    }

    case 'SeedGoalDeleted': {
      const seed = state.seeds[event.payload.seedId];
      if (!seed) return state;
      return {
        ...state,
        seeds: {
          ...state.seeds,
          [seed.id]: {
            ...seed,
            status: 'HARVESTED'
          }
        }
      };
    }

    case 'SeedDeleted': {
      const newSeeds = { ...state.seeds };
      delete newSeeds[event.payload.seedId];
      return { ...state, seeds: newSeeds };
    }

    default:
      return state;
  }
}
