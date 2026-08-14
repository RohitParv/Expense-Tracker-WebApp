import { CreditCard, Wallet } from "lucide-react";
import type { Expense, SpendingCategory } from "@/lib/supabase/types";

export const CATEGORY_LABEL: Record<Expense["category"], string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
};

export const CATEGORY_COLOR: Record<Expense["category"], string> = {
  credit_card: "#fb923c",
  debit_card: "#38bdf8",
};

export const CATEGORY_ICON: Record<Expense["category"], typeof CreditCard> = {
  credit_card: CreditCard,
  debit_card: Wallet,
};

export const SPENDING_CATEGORY_ORDER: SpendingCategory[] = [
  "groceries",
  "rent",
  "car_expenses",
  "food",
  "shopping",
  "utilities",
  "entertainment",
  "health",
  "travel",
  "subscriptions",
  "other",
];

export const SPENDING_CATEGORY_LABEL: Record<SpendingCategory, string> = {
  groceries: "Groceries",
  rent: "Rent",
  car_expenses: "Car Expenses",
  food: "Food",
  shopping: "Shopping",
  utilities: "Utilities",
  entertainment: "Entertainment",
  health: "Health",
  travel: "Travel",
  subscriptions: "Subscriptions",
  other: "Other",
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
