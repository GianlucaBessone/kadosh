'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/features/auth/user'

export async function registerTransaction(formData: FormData) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const type = formData.get('type') as string // "INCOME" | "EXPENSE" | "TRANSFER"
  const amountStr = formData.get('amount') as string
  const categoryId = formData.get('category') as string || null
  const dateStr = formData.get('date') as string
  const notes = formData.get('notes') as string || null

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Monto inválido' }
  }

  // Get default account
  const account = await prisma.account.findFirst({
    where: { userId: user.id }
  })

  if (!account) {
    return { error: 'No se encontró la cuenta principal' }
  }

  // Create transaction
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      type,
      amount,
      date: new Date(dateStr),
      notes,
      categoryId: categoryId ? categoryId : null,
    }
  })

  // Update account balance
  const balanceChange = type === 'INCOME' ? amount : (type === 'EXPENSE' ? -amount : 0)
  
  if (balanceChange !== 0) {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    })
  }

  revalidatePath('/home')
  revalidatePath('/register-tx')
  redirect('/home')
}
