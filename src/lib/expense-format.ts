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

// Only the first 7 categories get a dedicated chart color/slice — beyond that,
// hues stop being distinguishable at a glance. Health, travel, subscriptions,
// and other are folded into a shared "Other" slice (same color) instead.
export const SPENDING_CHART_INDIVIDUAL_CATEGORIES: SpendingCategory[] = SPENDING_CATEGORY_ORDER.slice(0, 7);
export const SPENDING_CHART_OTHER_CATEGORIES: SpendingCategory[] = SPENDING_CATEGORY_ORDER.slice(7);

export const SPENDING_CATEGORY_COLOR: Record<SpendingCategory, string> = {
  groceries: "#2a78d6",
  rent: "#eb6834",
  car_expenses: "#1baf7a",
  food: "#eda100",
  shopping: "#e87ba4",
  utilities: "#008300",
  entertainment: "#4a3aa7",
  health: "#e34948",
  travel: "#e34948",
  subscriptions: "#e34948",
  other: "#e34948",
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
