export const runtime = 'nodejs'
import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

// This endpoint should be hit daily at midnight by CronJobs.org
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Logic to select a random daily verse or from an external API
    // For now, we will select a random one from an array and save it for the day
    const verses = [
      { verse: "Donde esté tu tesoro, allí estará también tu corazón.", reference: "Mateo 6:21" },
      { verse: "El que es fiel en lo poco también es fiel en lo mucho.", reference: "Lucas 16:10" },
      { verse: "Honra al Señor con tus bienes.", reference: "Proverbios 3:9" },
      { verse: "Dios ama al dador alegre.", reference: "2 Corintios 9:7" },
      { verse: "Mía es la plata, y mío es el oro, dice Jehová de los ejércitos.", reference: "Hageo 2:8" },
    ]

    const random = verses[Math.floor(Math.random() * verses.length)]
    
    // Save to database
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.dailyVerse.create({
      data: {
        verse: random.verse,
        reference: random.reference,
        date: today
      }
    })

    return NextResponse.json({ success: true, verse: random })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
