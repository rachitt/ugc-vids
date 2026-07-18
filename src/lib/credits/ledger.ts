import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { creditLedger } from "@/lib/db/schema";

import { type CreditPlan, PLAN_CREDIT_ALLOWANCES } from "./constants";

type CreditLedgerClient = Pick<typeof db, "execute" | "insert" | "select">;

export type CreditLedgerMetadata = Record<string, unknown>;

export class InsufficientCreditsError extends Error {
  constructor(
    readonly workspaceId: string,
    readonly requiredCredits: number,
    readonly availableCredits: number,
  ) {
    super(
      `Workspace ${workspaceId} has ${availableCredits} credits but ${requiredCredits} are required.`,
    );
    this.name = "InsufficientCreditsError";
  }
}

export type DebitCreditsInput = {
  workspaceId: string;
  amount: number;
  reason: string;
  metadata?: CreditLedgerMetadata;
};

export type DebitCreditsResult = {
  entry: typeof creditLedger.$inferSelect;
  balanceBefore: number;
  balanceAfter: number;
};

export type GrantPlanAllowanceInput = {
  workspaceId: string;
  plan: CreditPlan;
  reason?: string;
  metadata?: CreditLedgerMetadata;
};

export type GrantPlanAllowanceResult = {
  entry: typeof creditLedger.$inferSelect;
  balanceAfter: number;
};

function assertPositiveIntegerCredits(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Credit amount must be a positive integer.");
  }
}

async function lockWorkspaceCredits(
  client: Pick<CreditLedgerClient, "execute">,
  workspaceId: string,
) {
  await client.execute(
    sql`select pg_advisory_xact_lock(hashtext(${workspaceId}))`,
  );
}

async function readBalance(
  client: Pick<CreditLedgerClient, "select">,
  workspaceId: string,
) {
  const [row] = await client
    .select({
      balance: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int`,
    })
    .from(creditLedger)
    .where(eq(creditLedger.workspaceId, workspaceId));

  return Number(row?.balance ?? 0);
}

export async function getCreditBalance(workspaceId: string) {
  return readBalance(db, workspaceId);
}

export async function debitCreditsWithinTransaction(
  client: CreditLedgerClient,
  input: DebitCreditsInput,
): Promise<DebitCreditsResult> {
  assertPositiveIntegerCredits(input.amount);

  await lockWorkspaceCredits(client, input.workspaceId);

  const balanceBefore = await readBalance(client, input.workspaceId);

  if (balanceBefore < input.amount) {
    throw new InsufficientCreditsError(
      input.workspaceId,
      input.amount,
      balanceBefore,
    );
  }

  const [entry] = await client
    .insert(creditLedger)
    .values({
      workspaceId: input.workspaceId,
      delta: -input.amount,
      reason: input.reason,
      metadata: input.metadata ?? {},
    })
    .returning();

  if (!entry) {
    throw new Error("Failed to write credit debit entry.");
  }

  return {
    entry,
    balanceBefore,
    balanceAfter: balanceBefore - input.amount,
  };
}

export async function debitCredits(input: DebitCreditsInput) {
  return db.transaction((tx) => debitCreditsWithinTransaction(tx, input));
}

export async function grantPlanAllowanceWithinTransaction(
  client: CreditLedgerClient,
  input: GrantPlanAllowanceInput,
): Promise<GrantPlanAllowanceResult> {
  const allowance = PLAN_CREDIT_ALLOWANCES[input.plan];

  await lockWorkspaceCredits(client, input.workspaceId);

  const [entry] = await client
    .insert(creditLedger)
    .values({
      workspaceId: input.workspaceId,
      delta: allowance,
      reason: input.reason ?? "plan_allowance_grant",
      metadata: {
        ...(input.metadata ?? {}),
        plan: input.plan,
        allowance,
      },
    })
    .returning();

  if (!entry) {
    throw new Error("Failed to write plan allowance credit entry.");
  }

  return {
    entry,
    balanceAfter: await readBalance(client, input.workspaceId),
  };
}

export async function grantPlanAllowance(input: GrantPlanAllowanceInput) {
  return db.transaction((tx) =>
    grantPlanAllowanceWithinTransaction(tx, input),
  );
}
