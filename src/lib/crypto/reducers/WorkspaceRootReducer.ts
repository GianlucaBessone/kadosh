import { WorkspaceState } from '../../../store/types/WorkspaceState';
import { financeReducer, initialFinancialState } from './FinanceReducer';
import { devotionalReducer, initialDevotionalState } from './DevotionalReducer';

// Para simplificar el tipo AnyEvent, uniremos los tipos
type AnyDomainEvent = any; // En la vida real, UnionType de FinanceEvent | DevotionalEvent etc.

export const initialWorkspaceState: WorkspaceState = {
  id: '',
  finances: initialFinancialState,
  devotionals: initialDevotionalState,
  members: {},
  settings: {}
};

export function workspaceRootReducer(state: WorkspaceState = initialWorkspaceState, event: AnyDomainEvent): WorkspaceState {
  
  // Delegar a los reducers de dominio
  const newFinances = financeReducer(state.finances, event as any);
  const newDevotionals = devotionalReducer(state.devotionals, event as any);
  
  // Verificar si hubo cambios para mantener la inmutabilidad referencial si no cambió nada
  // (Zustand se beneficia de esto para no re-renderizar sin sentido)
  if (newFinances !== state.finances || newDevotionals !== state.devotionals) {
    return {
      ...state,
      finances: newFinances,
      devotionals: newDevotionals
    };
  }
  
  return state;
}
