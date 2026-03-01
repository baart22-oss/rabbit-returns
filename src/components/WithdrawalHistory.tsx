import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WithdrawalRequest } from "@/lib/withdrawalStorage";

interface WithdrawalHistoryProps {
  requests: WithdrawalRequest[];
}

const STATUS_VARIANT: Record<
  WithdrawalRequest["status"],
  "default" | "destructive" | "outline" | "secondary"
> = {
  processed: "default",
  approved: "secondary",
  rejected: "destructive",
  pending: "outline",
};

export default function WithdrawalHistory({ requests }: WithdrawalHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            No withdrawal requests yet.
          </p>
        ) : (
          requests.map((wr) => (
            <div
              key={wr.id}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b pb-3"
            >
              <div className="space-y-1">
                <p className="font-bold">R{wr.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(wr.createdAt).toLocaleDateString()} •{" "}
                  {wr.method === "EFT" ? "EFT / Bank Transfer" : "Crypto / Wallet"}
                </p>
                {wr.method === "EFT" && wr.bankDetails && (
                  <p className="text-xs text-muted-foreground">
                    {wr.bankDetails.bankName} • {wr.bankDetails.accountNumber}
                  </p>
                )}
                {wr.method === "Crypto" && wr.walletAddress && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {wr.walletAddress}
                  </p>
                )}
                {wr.reason && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Note:</span> {wr.reason}
                  </p>
                )}
              </div>
              <Badge variant={STATUS_VARIANT[wr.status]}>{wr.status}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
