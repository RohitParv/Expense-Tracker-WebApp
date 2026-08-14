import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import type { BudgetCategory, ExpenseCategory, SpendingCategory } from "@/lib/supabase/types";
import { SPENDING_CATEGORY_ORDER } from "@/lib/expense-format";

const SPENDING_CATEGORIES = SPENDING_CATEGORY_ORDER.join(", ");

const SYSTEM_PROMPT = `You are the built-in financial assistant for a personal expense tracker web app.
Every expense has two independent dimensions:
1. Payment method: "credit_card" or "debit_card".
2. Spending category: one of ${SPENDING_CATEGORIES}.
You have tools to read their expenses (filterable by either dimension), read their budgets, and set or delete budgets on their behalf.
Budgets are set by payment method ("credit_card" or "debit_card") or as an "overall" monthly budget — not per spending category.

Behave like a helpful, concise financial assistant:
- Summarize spending conversationally when asked (totals, trends, category breakdowns).
- Help the user set, update, or remove budgets when they ask ("set my credit card budget to $400").
- Proactively suggest useful observations when relevant (e.g. overspending vs. budget, unusual spikes), but don't lecture.
- Always use tools to get real data before answering questions about the user's spending — never guess numbers.
- Format currency as USD with a $ sign. Keep replies short and readable in a chat UI — a few sentences or a short list, not long reports.`;

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_expense_summary",
    description:
      "Get aggregated expense totals for an optional date range, broken down by payment method and by spending category. Use this for summaries, trends, and budget comparisons.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: {
          type: Type.STRING,
          description: "Start date (YYYY-MM-DD), inclusive. Omit for no lower bound.",
        },
        to: {
          type: Type.STRING,
          description: "End date (YYYY-MM-DD), inclusive. Omit for no upper bound.",
        },
        spending_category: {
          type: Type.STRING,
          description: `Restrict to one spending category: one of ${SPENDING_CATEGORIES}. Omit for all.`,
        },
      },
    },
  },
  {
    name: "list_recent_expenses",
    description: "List individual expense transactions, most recent first.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: "Max number of transactions to return. Default 10, max 50.",
        },
        from: { type: Type.STRING, description: "Start date (YYYY-MM-DD), inclusive." },
        to: { type: Type.STRING, description: "End date (YYYY-MM-DD), inclusive." },
        category: {
          type: Type.STRING,
          description: "Filter to one payment method: credit_card or debit_card. Omit for both.",
        },
        spending_category: {
          type: Type.STRING,
          description: `Filter to one spending category: one of ${SPENDING_CATEGORIES}. Omit for all.`,
        },
      },
    },
  },
  {
    name: "get_budgets",
    description: "Get all budgets the user has configured (overall and/or per category).",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "set_budget",
    description: "Create or update a monthly budget limit for a category or the overall spend.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: "One of: credit_card, debit_card, overall.",
        },
        monthly_limit: {
          type: Type.NUMBER,
          description: "The monthly budget limit in dollars. Must be greater than 0.",
        },
      },
      required: ["category", "monthly_limit"],
    },
  },
  {
    name: "delete_budget",
    description: "Remove a previously set budget for a category or the overall spend.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: "One of: credit_card, debit_card, overall.",
        },
      },
      required: ["category"],
    },
  },
];

const tools = [{ functionDeclarations }];

type ChatMessage = { role: "user" | "assistant"; text: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = user.id;

  const body = (await req.json()) as { history?: ChatMessage[]; message?: string };
  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  const history = Array.isArray(body.history) ? body.history : [];

  async function executeTool(name: string, args: Record<string, unknown>) {
    if (name === "get_expense_summary") {
      let query = supabase.from("expenses").select("amount, category, spending_category");
      if (typeof args.from === "string") query = query.gte("date", args.from);
      if (typeof args.to === "string") query = query.lte("date", args.to);
      if (
        typeof args.spending_category === "string" &&
        SPENDING_CATEGORY_ORDER.includes(args.spending_category as SpendingCategory)
      ) {
        query = query.eq("spending_category", args.spending_category as SpendingCategory);
      }
      const { data, error } = await query;
      if (error) return { error: error.message };
      const byCategory: Record<ExpenseCategory, number> = { credit_card: 0, debit_card: 0 };
      const bySpendingCategory: Partial<Record<SpendingCategory, number>> = {};
      let total = 0;
      for (const row of data ?? []) {
        const amount = Number(row.amount);
        total += amount;
        byCategory[row.category as ExpenseCategory] += amount;
        const spendingCategory = row.spending_category as SpendingCategory;
        bySpendingCategory[spendingCategory] = (bySpendingCategory[spendingCategory] ?? 0) + amount;
      }
      return {
        total,
        by_payment_method: byCategory,
        by_spending_category: bySpendingCategory,
        transaction_count: data?.length ?? 0,
      };
    }

    if (name === "list_recent_expenses") {
      const limit = Math.min(Number(args.limit) || 10, 50);
      let query = supabase
        .from("expenses")
        .select("amount, category, spending_category, description, date")
        .order("date", { ascending: false })
        .limit(limit);
      if (typeof args.from === "string") query = query.gte("date", args.from);
      if (typeof args.to === "string") query = query.lte("date", args.to);
      if (args.category === "credit_card" || args.category === "debit_card") {
        query = query.eq("category", args.category);
      }
      if (
        typeof args.spending_category === "string" &&
        SPENDING_CATEGORY_ORDER.includes(args.spending_category as SpendingCategory)
      ) {
        query = query.eq("spending_category", args.spending_category as SpendingCategory);
      }
      const { data, error } = await query;
      if (error) return { error: error.message };
      return { expenses: data };
    }

    if (name === "get_budgets") {
      const { data, error } = await supabase
        .from("budgets")
        .select("category, monthly_limit");
      if (error) return { error: error.message };
      return { budgets: data };
    }

    if (name === "set_budget") {
      const category = args.category as BudgetCategory;
      const monthlyLimit = Number(args.monthly_limit);
      if (!["credit_card", "debit_card", "overall"].includes(category)) {
        return { error: "category must be credit_card, debit_card, or overall." };
      }
      if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
        return { error: "monthly_limit must be a positive number." };
      }
      const { error } = await supabase.from("budgets").upsert(
        {
          user_id: userId,
          category,
          monthly_limit: monthlyLimit,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,category" }
      );
      if (error) return { error: error.message };
      return { success: true, category, monthly_limit: monthlyLimit };
    }

    if (name === "delete_budget") {
      const category = args.category as BudgetCategory;
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("category", category);
      if (error) return { error: error.message };
      return { success: true, category };
    }

    return { error: `Unknown tool: ${name}` };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents: Content[] = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    let response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents,
      config: { systemInstruction: SYSTEM_PROMPT, tools },
    });

    for (let i = 0; i < 8; i++) {
      const calls = response.functionCalls;
      if (!calls || calls.length === 0) break;

      const modelParts = response.candidates?.[0]?.content?.parts;
      if (modelParts) contents.push({ role: "model", parts: modelParts });

      const responseParts = await Promise.all(
        calls.map(async (call) => ({
          functionResponse: {
            name: call.name,
            response: await executeTool(
              call.name ?? "",
              (call.args ?? {}) as Record<string, unknown>
            ),
          },
        }))
      );
      contents.push({ role: "user", parts: responseParts });

      response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents,
        config: { systemInstruction: SYSTEM_PROMPT, tools },
      });
    }

    return NextResponse.json({ reply: response.text ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
