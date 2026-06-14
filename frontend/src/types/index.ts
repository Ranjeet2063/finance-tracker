export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  preferences: {
    darkMode: boolean;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      billReminders: boolean;
      overspendAlerts: boolean;
      weeklySummary: boolean;
    };
  };
  emailVerified: boolean;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  user: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  currency: string;
  tags?: string[];
  receipt?: { url: string; filename: string };
  isRecurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  source?: 'manual' | 'voice' | 'ocr' | 'import';
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  user: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  alertsEnabled: boolean;
  alertThreshold: number;
  isActive: boolean;
  rollover: boolean;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface Notification {
  _id: string;
  user: string;
  type: 'bill_reminder' | 'overspend_alert' | 'budget_warning' | 'monthly_summary' | 'goal_milestone' | 'ai_insight';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  recentTransactions: Transaction[];
  categoryBreakdown: { _id: string; total: number; count: number }[];
  trends: any[];
  period: { month: number; year: number };
}

export interface FinancialHealth {
  score: number;
  category: string;
  description: string;
  components: {
    savingsRate: number;
    spendingBehavior: number;
    budgetDiscipline: number;
    financialConsistency: number;
  };
  improvements: string[];
}

export interface AIPrediction {
  nextWeek: { amount: number; confidence: number };
  nextMonth: { amount: number; confidence: number };
  nextMonthSavings: number;
  trend: string;
}

export interface SavingAdvice {
  type: string;
  category?: string;
  message: string;
  potentialSavings: number;
}

export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Education', 'Health', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];
