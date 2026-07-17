import { FinanceEvent } from '../../../domain/events/FinanceEvents';
import { FinancialState, Account, Transaction, Category, Commitment } from '../../../store/types/WorkspaceState';

export const initialFinancialState: FinancialState = {
  accounts: {},
  transactions: {},
  categories: {},
  commitments: {}
};

export function financeReducer(state: FinancialState = initialFinancialState, event: FinanceEvent): FinancialState {
  switch (event.type) {
    case 'AccountCreated': {
      const account: Account = {
        id: event.payload.accountId,
        name: event.payload.name,
        currency: event.payload.currency,
        type: event.payload.type,
        balance: event.payload.initialBalance
      };
      return {
        ...state,
        accounts: { ...state.accounts, [account.id]: account }
      };
    }

    case 'AccountUpdated': {
      const account = state.accounts[event.payload.accountId];
      if (!account) return state;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [account.id]: {
            ...account,
            name: event.payload.name ?? account.name,
            currency: event.payload.currency ?? account.currency
          }
        }
      };
    }

    case 'AccountDeleted': {
      const newAccounts = { ...state.accounts };
      delete newAccounts[event.payload.accountId];
      return { ...state, accounts: newAccounts };
    }

    case 'TransactionCreated': {
      const tx: Transaction = {
        id: event.payload.transactionId,
        accountId: event.payload.accountId,
        amount: event.payload.amount,
        type: event.payload.type,
        categoryId: event.payload.categoryId,
        date: event.payload.date,
        description: event.payload.description,
        transferAccountId: event.payload.transferAccountId
      };

      const newAccounts = { ...state.accounts };
      const account = newAccounts[tx.accountId];
      if (account) {
        if (tx.type === 'INCOME') account.balance += tx.amount;
        if (tx.type === 'EXPENSE') account.balance -= tx.amount;
        if (tx.type === 'TRANSFER') {
          account.balance -= tx.amount;
          const transferAcc = newAccounts[tx.transferAccountId!];
          if (transferAcc) transferAcc.balance += tx.amount;
        }
      }

      return {
        ...state,
        transactions: { ...state.transactions, [tx.id]: tx },
        accounts: newAccounts
      };
    }

    case 'TransactionUpdated': {
      // In a pure event sourcing system, updating a transaction means reversing the old one and applying the new one.
      // For simplicity in this reducer, we compute the difference if the amount/type changed.
      const oldTx = state.transactions[event.payload.transactionId];
      if (!oldTx) return state;

      const newTx: Transaction = {
        ...oldTx,
        ...event.payload
      };

      const newAccounts = { ...state.accounts };
      
      // Reverse old tx impact
      if (newAccounts[oldTx.accountId]) {
        if (oldTx.type === 'INCOME') newAccounts[oldTx.accountId].balance -= oldTx.amount;
        if (oldTx.type === 'EXPENSE') newAccounts[oldTx.accountId].balance += oldTx.amount;
        if (oldTx.type === 'TRANSFER') {
          newAccounts[oldTx.accountId].balance += oldTx.amount;
          if (newAccounts[oldTx.transferAccountId!]) {
            newAccounts[oldTx.transferAccountId!].balance -= oldTx.amount;
          }
        }
      }

      // Apply new tx impact
      if (newAccounts[newTx.accountId]) {
        if (newTx.type === 'INCOME') newAccounts[newTx.accountId].balance += newTx.amount;
        if (newTx.type === 'EXPENSE') newAccounts[newTx.accountId].balance -= newTx.amount;
        if (newTx.type === 'TRANSFER') {
          newAccounts[newTx.accountId].balance -= newTx.amount;
          if (newAccounts[newTx.transferAccountId!]) {
            newAccounts[newTx.transferAccountId!].balance += newTx.amount;
          }
        }
      }

      return {
        ...state,
        transactions: { ...state.transactions, [newTx.id]: newTx },
        accounts: newAccounts
      };
    }

    case 'TransactionDeleted': {
      const oldTx = state.transactions[event.payload.transactionId];
      if (!oldTx) return state;

      const newTransactions = { ...state.transactions };
      delete newTransactions[oldTx.id];

      const newAccounts = { ...state.accounts };
      
      // Reverse old tx impact
      if (newAccounts[oldTx.accountId]) {
        if (oldTx.type === 'INCOME') newAccounts[oldTx.accountId].balance -= oldTx.amount;
        if (oldTx.type === 'EXPENSE') newAccounts[oldTx.accountId].balance += oldTx.amount;
        if (oldTx.type === 'TRANSFER') {
          newAccounts[oldTx.accountId].balance += oldTx.amount;
          if (newAccounts[oldTx.transferAccountId!]) {
            newAccounts[oldTx.transferAccountId!].balance -= oldTx.amount;
          }
        }
      }

      return {
        ...state,
        transactions: newTransactions,
        accounts: newAccounts
      };
    }

    case 'CategoryCreated': {
      const category: Category = {
        id: event.payload.categoryId,
        name: event.payload.name,
        type: event.payload.type,
        icon: event.payload.icon,
        color: event.payload.color
      };
      return {
        ...state,
        categories: { ...state.categories, [category.id]: category }
      };
    }

    case 'CategoryDeleted': {
      const newCategories = { ...state.categories };
      delete newCategories[event.payload.categoryId];
      return { ...state, categories: newCategories };
    }

    case 'CommitmentCreated': {
      const commitment: Commitment = {
        id: event.payload.commitmentId,
        name: event.payload.name,
        amount: event.payload.amount,
        periodicity: event.payload.periodicity as any,
        type: event.payload.type as any,
        firstDueDate: event.payload.firstDueDate,
        endDate: event.payload.endDate
      };
      return {
        ...state,
        commitments: { ...state.commitments, [commitment.id]: commitment }
      };
    }

    // CommitmentPaid is tracked, but the financial impact is already covered by the separate TransactionCreated event
    // that the Domain service should have emitted alongside it.
    case 'CommitmentPaid': {
      return state;
    }

    default:
      return state;
  }
}
