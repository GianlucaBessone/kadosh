import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const excludeUserId = searchParams.get('excludeUserId');

  let intervalId: NodeJS.Timeout | null = null;
  let streamClosed = false;
  const signal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('retry: 5000\n\n'));

      const cleanup = () => {
        streamClosed = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        try {
          controller.close();
        } catch {
          // ignore if already closed
        }
      };

      const pushCount = async () => {
        if (streamClosed) return;

        const where: any = { status: 'ACTIVE', expiresAt: { gt: new Date() } };
        if (excludeUserId) {
          where.userId = { not: excludeUserId };
        }

        const activeCount = await prisma.prayerRequest.count({ where });
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activeCount })}\n\n`));
        } catch {
          cleanup();
        }
      };

      if (signal) {
        signal.addEventListener('abort', cleanup, { once: true });
      }

      await pushCount().catch(() => {
        cleanup();
      });

      if (!streamClosed) {
        intervalId = setInterval(() => {
          pushCount().catch(() => {
            cleanup();
          });
        }, 4000);
      }
    },
    cancel() {
      if (!streamClosed) {
        streamClosed = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
