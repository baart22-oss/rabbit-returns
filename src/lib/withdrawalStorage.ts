const STORAGE_KEY = "withdrawal_requests";

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  method: "EFT" | "Crypto";
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    branchCode: string;
  };
  walletAddress?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "processed";
  createdAt: string;
  processedAt?: string;
}

export function getAllWithdrawalRequests(): WithdrawalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to parse withdrawal requests from localStorage:", err);
    return [];
  }
}

export function getUserWithdrawalRequests(userId: string): WithdrawalRequest[] {
  return getAllWithdrawalRequests().filter((r) => r.userId === userId);
}

export function saveWithdrawalRequest(
  request: Omit<WithdrawalRequest, "id" | "createdAt" | "status">
): WithdrawalRequest {
  const all = getAllWithdrawalRequests();
  const newRequest: WithdrawalRequest = {
    ...request,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  all.push(newRequest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newRequest;
}

export function updateWithdrawalStatus(
  id: string,
  status: WithdrawalRequest["status"]
): void {
  const all = getAllWithdrawalRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) {
    console.warn(`Withdrawal request with id "${id}" not found in localStorage.`);
    return;
  }
  all[idx].status = status;
  if (status === "processed") {
    all[idx].processedAt = new Date().toISOString();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
