import { db } from '@/lib/db';
import { toast } from 'sonner';
import { clearSupabaseCookies } from '@/features/auth/localAuth';

export class WorkspaceAssociationService {
  /**
   * Intenta reclamar el workspace local actual si existe una sesión válida.
   * Resuelve los casos de múltiples dispositivos.
   */
  static async checkAndClaimWorkspace(): Promise<boolean> {
    try {
      const hasSupabaseSession = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
      if (!hasSupabaseSession) {
        return false;
      }

      // Obtener el Workspace local actual
      const localWorkspace = await db.workspaces.toCollection().first();
      if (!localWorkspace) {
        console.warn('No local workspace found to claim.');
        return false;
      }

      // 1. Obtener Workspaces en la nube
      const workspacesRes = await fetch('/api/workspaces', {
        method: 'GET',
        credentials: 'include',
      });
      if (!workspacesRes.ok) {
        const errorText = await workspacesRes.text();
        if (workspacesRes.status === 401 || workspacesRes.status === 403) {
          console.warn('Unauthorized cloud workspace fetch. Clearing stale Supabase session cookies.', workspacesRes.status, errorText);
          clearSupabaseCookies();
          return false;
        }

        console.error('Failed to fetch cloud workspaces', workspacesRes.status, errorText);
        return false;
      }
      
      const { workspaces } = await workspacesRes.json();
      
      // 2. Evaluar conflictos (Multi-dispositivo)
      const hasCloudWorkspaces = workspaces && workspaces.length > 0;
      const isLocalWorkspaceInCloud = workspaces.some((w: any) => w.id === localWorkspace.id);

      if (hasCloudWorkspaces && !isLocalWorkspaceInCloud) {
        // Dispositivo nuevo con datos locales, y ya tiene otros workspaces en la nube
        const eventsCount = await db.workspaceEvents.where('workspaceId').equals(localWorkspace.id).count();
        const nonSetupEventsCount = await db.workspaceEvents
          .where('workspaceId')
          .equals(localWorkspace.id)
          .filter(event => event.eventType !== 'AccountCreated' && event.eventType !== 'CategoryCreated' && event.eventType !== 'WorkspaceCreated')
          .count();

        // Si el dispositivo tiene datos reales (no solo el setup inicial)
        if (nonSetupEventsCount > 0) {
          console.warn('Conflicto detectado: Datos locales existentes y Workspace en la nube distinto.');
          toast.error('Conflicto de sincronización: Posees datos en este dispositivo y en la nube. Debes elegir cómo proceder (opción en desarrollo).');
          return false;
        } else {
          // Si el dispositivo no tiene datos financieros reales, descargar el workspace de la nube
          console.log('Dispositivo sin datos. Descargando workspace existente...');
          const cloudWorkspaceId = workspaces[0].id;
          
          // Reemplazar el workspaceId local
          await db.workspaces.clear();
          await db.workspaces.put({
            ...localWorkspace,
            id: cloudWorkspaceId
          });
          
          toast.success('Workspace de la nube enlazado exitosamente. Recargando...');
          setTimeout(() => window.location.reload(), 1500);
          return true;
        }
      }

      // 3. Reclamar el Workspace (Casos: no hay en la nube, o ya está en la nube)
      const claimRes = await fetch('/api/workspaces/claim', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: localWorkspace.id })
      });

      if (!claimRes.ok) {
        if (claimRes.status === 409) {
          toast.error('Este espacio de trabajo ya pertenece a otro usuario.');
        } else {
          toast.error('Error al asociar el espacio de trabajo.');
        }
        return false;
      }

      console.log('Workspace reclamado exitosamente en la nube.');
      return true;

    } catch (error) {
      console.error('Error in WorkspaceAssociationService:', error);
      return false;
    }
  }
}
