'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

export async function getAuthUser() {
  const supabase = await createClient()
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.warn('Supabase auth error (ignoring for offline-first):', error);
    return null;
  }
  
  if (!user) return null

  // Ensure user exists in Prisma
  let prismaUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!prismaUser) {
    prismaUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
        lastName: user.user_metadata?.lastName || null,
      }
    })
    
    // Create default account
    await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Cuenta Principal',
        balance: 0,
      }
    })
  }

  return prismaUser
}
