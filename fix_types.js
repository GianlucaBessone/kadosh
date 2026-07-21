const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, replacements) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { search, replace } of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(filepath, content);
}

// 1. API routes implicit any
replaceInFile('src/app/api/prayer-requests/pray-all/route.ts', [
  { search: 'filter(r => r.status', replace: 'filter((r: any) => r.status' },
]);

replaceInFile('src/app/api/prayer-requests/route.ts', [
  { search: 'filter(r => r.status', replace: 'filter((r: any) => r.status' },
  { search: 'map(r => ({', replace: 'map((r: any) => ({' },
  { search: 'const items = requests.map(r => {', replace: 'const items = requests.map((r: any) => {' },
  { search: 'hasPrayed: r.interactions.some(i => i.type', replace: 'hasPrayed: r.interactions.some((i: any) => i.type' },
  { search: 'hasJoined: r.interactions.some(i => i.type', replace: 'hasJoined: r.interactions.some((i: any) => i.type' },
  { search: 'items.filter(i => i.hasPrayed)', replace: 'items.filter((i: any) => i.hasPrayed)' },
  { search: 'items.filter(i => !i.hasJoined)', replace: 'items.filter((i: any) => !i.hasJoined)' },
  { search: 'items.filter(i => i.hasJoined)', replace: 'items.filter((i: any) => i.hasJoined)' },
  { search: 'items.filter(i => !i.hasPrayed)', replace: 'items.filter((i: any) => !i.hasPrayed)' }
]);

replaceInFile('src/app/api/sync/pull/route.ts', [
  { search: 'map(w => w.id)', replace: 'map((w: any) => w.id)' }
]);

replaceInFile('src/app/api/sync/push/route.ts', [
  { search: 'w => w.workspaceId', replace: '(w: any) => w.workspaceId' },
  { search: 'await prisma.$transaction(async (tx) => {', replace: 'await prisma.$transaction(async (tx: any) => {' }
]);

replaceInFile('src/app/api/workspaces/claim/route.ts', [
  { search: 'await prisma.$transaction(async (tx) => {', replace: 'await prisma.$transaction(async (tx: any) => {' }
]);

// 2. Tests
replaceInFile('tests/integration/PrayerCard.test.tsx', [
  { search: 'prayerCount: 5,\n      joinedCount: 2,\n      workspaceId: null,', replace: 'prayerCount: 5,\n      joinedCount: 2,\n      workspaceId: null,\n      archivedAt: null,\n      daysRemaining: 7,\n      authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: false,' },
  { search: 'prayerCount: 5,\n      joinedCount: 2,\n      workspaceId: null,\n      status: \'ARCHIVED\'', replace: 'prayerCount: 5,\n      joinedCount: 2,\n      workspaceId: null,\n      status: \'ARCHIVED\',\n      archivedAt: new Date().toISOString(),\n      daysRemaining: 0,\n      authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: false' },
  { search: 'workspaceId: null,\n      status: \'ACTIVE\'\n    };\n\n    render', replace: 'workspaceId: null,\n      status: \'ACTIVE\',\n      archivedAt: null,\n      daysRemaining: 7,\n      authorInitial: "J",\n      hasPrayed: false\n    };\n\n    render' },
  { search: 'prayerCount: 5,\n      joinedCount: 2,\n      workspaceId: null,\n      status: \'ACTIVE\'\n    };\n\n    render(<PrayerCard', replace: 'prayerCount: 5,\n      joinedCount: 2,\n      workspaceId: null,\n      status: \'ACTIVE\',\n      archivedAt: null,\n      daysRemaining: 7,\n      authorInitial: "J"\n    };\n\n    render(<PrayerCard' }
]);

replaceInFile('tests/integration/PrayerTabs.test.tsx', [
  { search: 'prayerCount: 5,\n      workspaceId: null,\n      status: \'ACTIVE\'', replace: 'prayerCount: 5,\n      workspaceId: null,\n      status: \'ACTIVE\',\n      archivedAt: null,\n      daysRemaining: 7,\n      authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: true' },
  { search: 'joinedCount: 2,\n      workspaceId: null,\n      status: \'ACTIVE\'', replace: 'joinedCount: 2,\n      workspaceId: null,\n      status: \'ACTIVE\',\n      archivedAt: null,\n      daysRemaining: 7,\n      authorInitial: "M",\n      hasPrayed: false,\n      hasJoined: false' }
]);

replaceInFile('tests/stress/prayerConcurrency.test.ts', [
  { search: 'workspaceId: null,\n      updatedAt: new Date().toISOString()', replace: 'workspaceId: null,\n      archivedAt: null,\n      updatedAt: new Date().toISOString()' }
]);

replaceInFile('tests/unit/prayerSyncPipeline.test.ts', [
  { search: 'workspaceId: null,\n        updatedAt: new Date().toISOString()', replace: 'workspaceId: null,\n        archivedAt: null,\n        updatedAt: new Date().toISOString()' }
]);

replaceInFile('tests/unit/syncQueueService.test.ts', [
  { search: 'action: \'PRAY_FOR_REQUEST\',', replace: 'tableName: \'prayerInteractions\',\n      recordId: \'req-test\',\n      operation: \'INSERT\',' }
]);

console.log('Fixes applied!');
