import "server-only";

import type { Account } from "pluggy-sdk/dist/types/account";
import type { Transaction } from "pluggy-sdk/dist/types/transaction";
import { PluggyConnectionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pluggyTransactionLookbackDays } from "@/lib/pluggy/env";
import { getPluggyServerClient } from "@/lib/pluggy/client";
import { withPluggyRetry } from "@/lib/pluggy/retry";
import { reconcilePluggyCreditsForSchool } from "@/lib/pluggy/reconcile-pluggy-payments";

function formatDateYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type PluggyPage<T> = { results: T[]; page: number; totalPages: number };

async function fetchAccountPages(itemId: string): Promise<Account[]> {
  const client = getPluggyServerClient();
  const api = client as unknown as {
    createGetRequest<T>(
      endpoint: string,
      params?: Record<string, string | number | undefined>
    ): Promise<PluggyPage<T>>;
  };

  const merged: Account[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const res = await withPluggyRetry(() =>
      api.createGetRequest<Account>("accounts", { itemId, page })
    );
    merged.push(...res.results);
    totalPages = Math.max(1, res.totalPages);
    page += 1;
  }
  return merged;
}

function txPaymentDataJson(
  tx: Transaction
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!tx.paymentData) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(tx.paymentData)) as Prisma.InputJsonValue;
}

export type PluggySyncResult = {
  accountsUpserted: number;
  transactionsUpserted: number;
  reconciliationsApplied: number;
};

export async function syncPluggyConnectionForSchool(
  schoolId: string
): Promise<PluggySyncResult> {
  const connection = await prisma.schoolPluggyConnection.findUnique({
    where: { schoolId },
  });
  if (!connection) {
    throw new Error("PLUGGY_CONNECTION_NOT_FOUND");
  }

  const syncLog = await prisma.pluggySyncLog.create({
    data: {
      schoolId,
      connectionId: connection.id,
      phase: "FULL_SYNC",
      status: "RUNNING",
    },
  });

  const client = getPluggyServerClient();
  let accountsUpserted = 0;
  let transactionsUpserted = 0;

  try {
    const item = await withPluggyRetry(() =>
      client.fetchItem(connection.pluggyItemId)
    );

    const pluggyStatus = item.status;
    const connStatus =
      pluggyStatus === "LOGIN_ERROR" ? PluggyConnectionStatus.ERROR
      : PluggyConnectionStatus.ACTIVE;

    await prisma.schoolPluggyConnection.update({
      where: { id: connection.id },
      data: {
        pluggyItemStatus: pluggyStatus,
        lastPluggyItemUpdateAt: item.updatedAt,
        status: connStatus,
        lastSyncError:
          pluggyStatus === "LOGIN_ERROR" ?
            (item.error?.message ?? "LOGIN_ERROR").slice(0, 4000)
          : null,
      },
    });

    if (pluggyStatus === "LOGIN_ERROR") {
      await prisma.pluggySyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "ERROR",
          detail: "Item em LOGIN_ERROR na Pluggy.",
          finishedAt: new Date(),
        },
      });
      return { accountsUpserted: 0, transactionsUpserted: 0, reconciliationsApplied: 0 };
    }

    const accounts = await fetchAccountPages(connection.pluggyItemId);

    for (const acc of accounts) {
      const row = await prisma.pluggyAccount.upsert({
        where: {
          schoolId_pluggyAccountId: {
            schoolId,
            pluggyAccountId: acc.id,
          },
        },
        create: {
          schoolId,
          connectionId: connection.id,
          pluggyAccountId: acc.id,
          pluggyItemId: acc.itemId,
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          currencyCode: acc.currencyCode,
          balance: new Prisma.Decimal(acc.balance),
          bankClosingBalance:
            acc.bankData?.closingBalance != null ?
              new Prisma.Decimal(acc.bankData.closingBalance)
            : null,
          numberMasked: acc.number ?? null,
          ownerName: acc.owner,
          updatedAtPluggy: item.updatedAt,
        },
        update: {
          connectionId: connection.id,
          pluggyItemId: acc.itemId,
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          currencyCode: acc.currencyCode,
          balance: new Prisma.Decimal(acc.balance),
          bankClosingBalance:
            acc.bankData?.closingBalance != null ?
              new Prisma.Decimal(acc.bankData.closingBalance)
            : null,
          numberMasked: acc.number ?? null,
          ownerName: acc.owner,
          updatedAtPluggy: item.updatedAt,
        },
      });
      accountsUpserted += 1;

      const lookbackDays = pluggyTransactionLookbackDays();
      const from = new Date();
      from.setDate(from.getDate() - lookbackDays);
      const txs = await withPluggyRetry(() =>
        client.fetchAllTransactions(acc.id, {
          dateFrom: formatDateYmd(from),
        })
      );

      for (const tx of txs) {
        await prisma.pluggyTransaction.upsert({
          where: {
            schoolId_pluggyTransactionId: {
              schoolId,
              pluggyTransactionId: tx.id,
            },
          },
          create: {
            schoolId,
            connectionId: connection.id,
            accountId: row.id,
            pluggyTransactionId: tx.id,
            pluggyAccountId: tx.accountId,
            date: tx.date,
            amount: new Prisma.Decimal(tx.amount),
            currencyCode: tx.currencyCode,
            type: tx.type,
            description: tx.description.slice(0, 2000),
            descriptionRaw: tx.descriptionRaw ? tx.descriptionRaw.slice(0, 4000) : null,
            status: tx.status ?? null,
            category: tx.category,
            paymentData: txPaymentDataJson(tx),
          },
          update: {
            date: tx.date,
            amount: new Prisma.Decimal(tx.amount),
            currencyCode: tx.currencyCode,
            type: tx.type,
            description: tx.description.slice(0, 2000),
            descriptionRaw: tx.descriptionRaw ? tx.descriptionRaw.slice(0, 4000) : null,
            status: tx.status ?? undefined,
            category: tx.category,
            paymentData: txPaymentDataJson(tx),
          },
        });
        transactionsUpserted += 1;
      }
    }

    const reconciliationsApplied = await reconcilePluggyCreditsForSchool(schoolId);

    await prisma.schoolPluggyConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        lastSyncError: null,
        status: PluggyConnectionStatus.ACTIVE,
      },
    });

    await prisma.pluggySyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "SUCCESS",
        accountsUpserted,
        transactionsUpserted,
        reconciliationsApplied,
        finishedAt: new Date(),
      },
    });

    return { accountsUpserted, transactionsUpserted, reconciliationsApplied };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.schoolPluggyConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncError: msg.slice(0, 4000),
        status: PluggyConnectionStatus.ERROR,
      },
    });
    await prisma.pluggySyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "ERROR",
        detail: msg.slice(0, 4000),
        accountsUpserted,
        transactionsUpserted,
        finishedAt: new Date(),
      },
    });
    throw e;
  }
}
