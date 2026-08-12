import { CreditCard, Wallet } from "lucide-react";
import type { Expense } from "@/lib/supabase/types";

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

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
