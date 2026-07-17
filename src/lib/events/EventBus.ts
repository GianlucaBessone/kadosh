import EventEmitter from 'eventemitter3';

export interface AppEvents {
  // Autenticación
  'auth.session.changed': (session: any | null) => void;

  // Workspaces
  'workspace.active.changed': (workspaceId: string) => void;
  
  // Event Sourcing & Sincronización
  'workspace.events.changed': (events: any[]) => void;
  'workspace.sync.started': () => void;
  'workspace.sync.completed': (timestamp: string) => void;
  'workspace.sync.failed': (error: Error) => void;
  
  // Snapshots
  'workspace.snapshot.created': (snapshotId: string) => void;
  'workspace.snapshot.loaded': (workspaceId: string) => void;

  // Key Management
  'workspace.key.rotated': (workspaceId: string) => void;

  // Members
  'workspace.member.joined': (payload: { workspaceId: string, userId: string }) => void;
  'workspace.member.left': (payload: { workspaceId: string, userId: string }) => void;

  // Domain Events (Generic, though the Reducer handles these internally usually)
  'account.created': (accountId: string) => void;
  'transaction.created': (transactionId: string) => void;
  'commitment.created': (commitmentId: string) => void;

  // System
  'theme.changed': (theme: string) => void;
  'notification.received': (notification: any) => void;
}

class EventBusService {
  private emitter = new EventEmitter<AppEvents>();

  public on<K extends keyof AppEvents>(event: K, fn: AppEvents[K]): void {
    // @ts-ignore - TS has trouble correlating K with AppEvents[K] here
    this.emitter.on(event, fn);
  }

  public off<K extends keyof AppEvents>(event: K, fn: AppEvents[K]): void {
    // @ts-ignore
    this.emitter.off(event, fn);
  }

  public emit<K extends keyof AppEvents>(event: K, ...args: Parameters<AppEvents[K]>): void {
    // @ts-ignore
    this.emitter.emit(event, ...args);
  }
}

export const EventBus = new EventBusService();
