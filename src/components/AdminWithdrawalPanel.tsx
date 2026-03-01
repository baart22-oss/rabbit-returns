import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  updateWithdrawalStatus,
  type WithdrawalRequest,
} from "@/lib/withdrawalStorage";
import { toast } from "sonner";

interface AdminWithdrawalPanelProps {
  requests: WithdrawalRequest[];
  onRefresh: () => void;
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

export default function AdminWithdrawalPanel({
  requests,
  onRefresh,
}: AdminWithdrawalPanelProps) {
  const handleStatus = (id: string, status: WithdrawalRequest["status"]) => {
    updateWithdrawalStatus(id, status);
    toast.success(`Withdrawal marked as ${status}.`);
    onRefresh();
  };

  if (requests.length === 0) {
    return (
      <p className="text-muted-foreground py-4">No withdrawal requests found.</p>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((wr) => (
        <Card key={wr.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-lg font-bold">R{wr.amount.toLocaleString()}</p>
                <Badge variant={STATUS_VARIANT[wr.status]}>{wr.status}</Badge>
                <p className="text-xs text-muted-foreground">
                  {wr.method === "EFT" ? "EFT / Bank Transfer" : "Crypto / Wallet"} •{" "}
                  {new Date(wr.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  User: {wr.userId}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {wr.status !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatus(wr.id, "approved")}
                  >
                    Approve
                  </Button>
                )}
                {wr.status !== "processed" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatus(wr.id, "processed")}
                  >
                    Process
                  </Button>
                )}
                {wr.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatus(wr.id, "rejected")}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>

            {wr.method === "EFT" && wr.bankDetails && (
              <div className="rounded bg-muted p-3 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-muted-foreground">Bank:</span>{" "}
                  {wr.bankDetails.bankName}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Account:</span>{" "}
                  {wr.bankDetails.accountNumber}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Holder:</span>{" "}
                  {wr.bankDetails.accountHolder}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Branch:</span>{" "}
                  {wr.bankDetails.branchCode}
                </div>
              </div>
            )}

            {wr.method === "Crypto" && wr.walletAddress && (
              <div className="rounded bg-muted p-3 text-xs">
                <span className="font-semibold text-muted-foreground">
                  Wallet/Address:
                </span>{" "}
                {wr.walletAddress}
              </div>
            )}

            {wr.reason && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Reason:</span> {wr.reason}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
