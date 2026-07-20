'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

export async function getAuthUser() {
  const supabase = await createClient()
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      // Si hay un error (como token expirado o inválido), lo logueamos como debug y retornamos null
      // para no interrumpir el modo offline-first.
      console.debug('Auth user not found or token invalid:', error.message);
      return null;
    }
    
    user = data.user;
  } catch (error: any) {
    console.warn('Supabase auth exception (ignoring for offline-first):', error?.message || error);
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
  }

  return prismaUser
}
