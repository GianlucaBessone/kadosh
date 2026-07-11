'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/features/auth/user'

export async function createSeedGoal(formData: FormData) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const targetAmountStr = formData.get('targetAmount') as string
  const targetAmount = parseFloat(targetAmountStr)

  if (!name || isNaN(targetAmount) || targetAmount <= 0) {
    redirect('/seeds/new?error=Datos inválidos')
  }

  await prisma.seedGoal.create({
    data: {
      userId: user.id,
      name,
      targetAmount,
    }
  })

  revalidatePath('/seeds')
  revalidatePath('/home')
  redirect('/seeds')
}

export async function waterSeed(formData: FormData) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const seedGoalId = formData.get('seedGoalId') as string
  const amountStr = formData.get('amount') as string
  const amount = parseFloat(amountStr)

  if (!seedGoalId || isNaN(amount) || amount <= 0) {
    redirect('/seeds?error=Datos inválidos')
  }

  // Verificar que la semilla pertenezca al usuario
  const seed = await prisma.seedGoal.findFirst({
    where: { id: seedGoalId, userId: user.id }
  })

  if (!seed) redirect('/seeds?error=Semilla no encontrada')

  await prisma.seedContribution.create({
    data: {
      seedGoalId,
      amount,
    }
  })

  await prisma.seedGoal.update({
    where: { id: seedGoalId },
    data: {
      currentAmount: {
        increment: amount
      }
    }
  })

  // Optionally deduct from account balance? The user flow usually deducts saving goals from main balance.
  // We will assume they just want to track it for now, or we can deduct it. Let's deduct it.
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

  revalidatePath('/seeds')
  revalidatePath('/home')
  redirect('/seeds')
}

export async function harvestSeed(formData: FormData) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const seedGoalId = formData.get('seedGoalId') as string

  const seed = await prisma.seedGoal.findFirst({
    where: { id: seedGoalId, userId: user.id }
  })

  if (!seed) redirect('/seeds?error=Semilla no encontrada')

  await prisma.seedGoal.update({
    where: { id: seedGoalId },
    data: {
      status: 'HARVESTED'
    }
  })

  // Return the money to the account balance
  const account = await prisma.account.findFirst({
    where: { userId: user.id }
  })

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: seed.currentAmount
        }
      }
    })
  }

  revalidatePath('/seeds')
  revalidatePath('/home')
  redirect('/seeds')
}
