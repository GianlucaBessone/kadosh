import { generateInstallmentsForMonth, installmentAppliesToPeriod } from './src/features/planning/utils/dateUtils';
import { CommitmentPeriodicity } from './src/lib/db';

const commitment = {
  id: "test",
  firstDueDate: "2026-07-14T03:00:00.000Z",
  periodicity: CommitmentPeriodicity.MONTHLY,
  isRecurring: false,
  installments: 1,
  currentInstallment: 0,
  biweeklyPeriod: 2,
  amountTotal: 90000,
  installmentAmount: 90000
} as any;

const allCommitments = [commitment];
const month = 7;
const year = 2026;
const period = 'MONTH';

const result = [];
for (const c of allCommitments) {
  const generated = generateInstallmentsForMonth(c, month, year);
  for (const inst of generated) {
    if (installmentAppliesToPeriod(c, inst, period)) {
      result.push({
        commitment: c,
        dueDate: inst.dueDate,
        installmentIndex: inst.installmentIndex
      });
    }
  }
}
console.log("Monthly Entries for July:", result);

const resAug = [];
for (const c of allCommitments) {
  const generated = generateInstallmentsForMonth(c, 8, year);
  for (const inst of generated) {
    if (installmentAppliesToPeriod(c, inst, period)) {
      resAug.push({
        commitment: c,
        dueDate: inst.dueDate,
        installmentIndex: inst.installmentIndex
      });
    }
  }
}
console.log("Monthly Entries for August:", resAug);
