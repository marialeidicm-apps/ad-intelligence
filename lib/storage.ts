import { Account, GeneratedSet } from './types';

const ACCOUNTS_KEY = 'ad_intelligence_accounts';
const HISTORY_KEY = 'ad_intelligence_history';

export function getAccounts(): Account[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAccount(account: Account): void {
  const accounts = getAccounts();
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function updateAccount(account: Account): void {
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.id === account.id);
  if (index >= 0) {
    accounts[index] = account;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export function deleteAccount(id: string): void {
  const accounts = getAccounts().filter((a) => a.id !== id);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  // also remove history for this account
  const history = getHistory().filter((s) => s.accountId !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getHistory(): GeneratedSet[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveGeneratedSet(set: GeneratedSet): void {
  const history = getHistory();
  history.unshift(set);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function deleteGeneratedSet(id: string): void {
  const history = getHistory().filter((s) => s.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
