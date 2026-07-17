import { create } from 'zustand';
import { RootState, WorkspaceState } from './types/WorkspaceState';
import { initialWorkspaceState, workspaceRootReducer } from '../lib/crypto/reducers/WorkspaceRootReducer';

interface WorkspaceStoreActions {
  setActiveWorkspace: (workspaceId: string) => void;
  initializeWorkspace: (workspaceId: string, initialState?: WorkspaceState) => void;
  dispatchEvents: (workspaceId: string, events: any[]) => void;
  // TODO: Add persist logic when integrating Snapshots
}

type WorkspaceStoreState = RootState & WorkspaceStoreActions;

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
  activeWorkspaceId: null,
  workspaces: {},

  setActiveWorkspace: (workspaceId: string) => {
    set({ activeWorkspaceId: workspaceId });
  },

  initializeWorkspace: (workspaceId: string, initialState?: WorkspaceState) => {
    set((state) => ({
      workspaces: {
        ...state.workspaces,
        [workspaceId]: initialState || { ...initialWorkspaceState, id: workspaceId }
      }
    }));
  },

  dispatchEvents: (workspaceId: string, events: any[]) => {
    set((state) => {
      const currentWorkspaceState = state.workspaces[workspaceId];
      if (!currentWorkspaceState) return state; // Ignore if workspace not initialized

      // Reducir todos los eventos secuencialmente utilizando el RootReducer puro
      const nextWorkspaceState = events.reduce(
        (accState, event) => workspaceRootReducer(accState, event),
        currentWorkspaceState
      );

      return {
        workspaces: {
          ...state.workspaces,
          [workspaceId]: nextWorkspaceState
        }
      };
    });
  }
}));
