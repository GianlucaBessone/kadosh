import { Command, CommandMetadata } from './FinanceCommands';

export type CreatePrayerRequestCommand = Command<'CREATE_PRAYER_REQUEST', {
  prayerRequestId: string;
  workspaceId: string;
  userId: string;
  message: string;
  expiresAt: string;
}>;

export type PrayForRequestCommand = Command<'PRAY_FOR_REQUEST', {
  prayerRequestId: string;
  interactionId: string;
  userId: string;
}>;

export type PrayerCommand = CreatePrayerRequestCommand | PrayForRequestCommand;
