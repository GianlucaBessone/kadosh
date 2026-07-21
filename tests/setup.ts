import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup fake-indexeddb for Dexie tests in Node
import 'fake-indexeddb/auto';

// Cleanup RTL after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Supabase Realtime if necessary, or let tests mock it individually
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  })),
}));
