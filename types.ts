export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  sheetBalance?: number; // The explicit balance value read from the sheet row
  type: 'income' | 'expense';
  originalRow: Record<string, string>;
}

export interface SheetStats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
}

export interface ChartDataPoint {
  date: string;
  balance: number;
  income: number;
  expense: number;
}

export interface MonthYear {
  month: number; // 0-11
  year: number;
  label: string;
}
