'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/features/auth/user'

export async function registerTithe(formData: FormData) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const amountStr = formData.get('amount') as string
  const notes = formData.get('notes') as string || null
  const amount = parseFloat(amountStr)

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Datos inválidos' }
  }

  const date = new Date()

  await prisma.tithe.create({
    data: {
      userId: user.id,
      amount,
      notes,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    }
  })

  // Deduct tithe from account
  const account = await prisma.account.findFirst({
    where: { userId: user.id }
  })

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: {
          decrement: amount
        }
      }
    })
  }

  revalidatePath('/tithe')
  revalidatePath('/home')
  redirect('/tithe')
}
