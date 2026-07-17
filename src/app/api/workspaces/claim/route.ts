import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/features/auth/user';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Execute within a transaction
    const result = await prisma.$transaction(async (tx) => {
      const existingWorkspace = await tx.workspace.findUnique({
        where: { id: workspaceId }
      });

      // Caso 1: No existe
      if (!existingWorkspace) {
        const workspace = await tx.workspace.create({
          data: {
            id: workspaceId,
            name: 'Personal',
            type: 'PERSONAL',
            ownerId: user.id
          }
        });
        
        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            roleTemplate: 'OWNER'
          }
        });
        
        // Create default account if needed? 
        // We probably don't need it because local Dexie already has it. But Prisma requires one for foreign keys?
        // Actually, the server doesn't use the Account table except as a domain model.
        // Wait, Domain models are not synced via Prisma CRUD, but Prisma might enforce relations if we sync later. 
        // For now, let's leave Account creation out as the local DB has the source of truth.
        return { status: 200, message: 'Workspace created and claimed' };
      }

      // Caso 3: Existe y es del mismo usuario (Idempotencia)
      if (existingWorkspace.ownerId === user.id) {
        return { status: 200, message: 'Workspace already claimed by this user' };
      }

      // Caso 4: Existe pero pertenece a otro usuario
      if (existingWorkspace.ownerId && existingWorkspace.ownerId !== user.id) {
        return { status: 409, message: 'Workspace already claimed by another user' };
      }

      // Caso 2: Existe sin dueño (esto es un caso teórico ya que ownerId es requerido, pero por las dudas)
      // En Prisma ownerId es String (not null). Si alguna vez fuese opcional, se haría acá.
      // Actualmente ownerId no puede ser null en Prisma schema.
      return { status: 400, message: 'Invalid workspace state' };
    });

    return NextResponse.json({ message: result.message }, { status: result.status });
  } catch (error) {
    console.error('Error claiming workspace:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
