export class ProjectionMutex {
  private static locks: Map<string, boolean> = new Map();

  static acquire(workspaceId: string): boolean {
    if (this.locks.get(workspaceId)) {
      return false; // Already locked
    }
    this.locks.set(workspaceId, true);
    return true;
  }

  static release(workspaceId: string): void {
    this.locks.delete(workspaceId);
  }
}
