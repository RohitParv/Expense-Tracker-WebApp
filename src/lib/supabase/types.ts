export type ExpenseCategory = "credit_card" | "debit_card";
export type BudgetCategory = "credit_card" | "debit_card" | "overall";
export type SpendingCategory =
  | "groceries"
  | "rent"
  | "car_expenses"
  | "food"
  | "shopping"
  | "utilities"
  | "entertainment"
  | "health"
  | "travel"
  | "subscriptions"
  | "other";

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: ExpenseCategory;
          spending_category: SpendingCategory;
          description: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          amount: number;
          category: ExpenseCategory;
          spending_category: SpendingCategory;
          description?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: ExpenseCategory;
          spending_category?: SpendingCategory;
          description?: string | null;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: BudgetCategory;
          monthly_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          category: BudgetCategory;
          monthly_limit: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: BudgetCategory;
          monthly_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
