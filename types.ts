export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  color: string;
  iconKey: string;
  type: TransactionType;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO YYYY-MM-DD
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  CATEGORIES = 'CATEGORIES',
  CHAT = 'CHAT'
}