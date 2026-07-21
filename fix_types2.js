const fs = require('fs');

function replaceInFile(filepath, replacements) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { search, replace } of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(filepath, content);
}

replaceInFile('tests/unit/syncQueueService.test.ts', [
  { search: 'updatedAt: new Date().toISOString()', replace: 'updatedAt: new Date().toISOString(),\n      lastAttempt: null' },
  { search: 'action: \'PRAY_FOR_REQUEST\',', replace: 'tableName: \'prayerInteractions\',\n      recordId: \'req-test\',\n      operation: \'INSERT\',' }
]);

replaceInFile('tests/integration/PrayerCard.test.tsx', [
  { search: 'authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: false', replace: 'authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: false,\n      archivedAt: null,\n      daysRemaining: 7' },
  { search: 'authorInitial: "J",\n      hasPrayed: false\n    };\n\n    render', replace: 'authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: false,\n      archivedAt: null,\n      daysRemaining: 7\n    };\n\n    render' },
  { search: 'authorInitial: "J"\n    };\n\n    render', replace: 'authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: false,\n      archivedAt: null,\n      daysRemaining: 7\n    };\n\n    render' }
]);

replaceInFile('tests/integration/PrayerTabs.test.tsx', [
  { search: 'authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: true', replace: 'authorInitial: "J",\n      hasPrayed: false,\n      hasJoined: true,\n      archivedAt: null,\n      daysRemaining: 7' },
  { search: 'authorInitial: "M",\n      hasPrayed: false,\n      hasJoined: false', replace: 'authorInitial: "M",\n      hasPrayed: false,\n      hasJoined: false,\n      archivedAt: null,\n      daysRemaining: 7' }
]);

console.log('Fixes applied 2!');
