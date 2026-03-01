import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { saveWithdrawalRequest } from "@/lib/withdrawalStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface WithdrawalFormProps {
  availableBalance: number;
  onSuccess: () => void;
}

export default function WithdrawalForm({
  availableBalance,
  onSuccess,
}: WithdrawalFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("eft");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    bank_name: "",
    account_holder: "",
    account_number: "",
    branch_code: "",
  });

  const [otherDetails, setOtherDetails] = useState("");

  const MIN_WITHDRAWAL = 100;
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount =
    amountNum >= MIN_WITHDRAWAL && amountNum <= availableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in");
      return;
    }

    if (!isValidAmount) {
      toast.error(
        `Amount must be between R${MIN_WITHDRAWAL} and R${availableBalance.toLocaleString()}`
      );
      return;
    }

    if (method === "eft") {
      if (
        !bankDetails.bank_name ||
        !bankDetails.account_holder ||
        !bankDetails.account_number ||
        !bankDetails.branch_code
      ) {
        toast.error("Please fill all banking details");
        return;
      }
    } else {
      if (!otherDetails.trim()) {
        toast.error("Please provide your wallet address or payment details");
        return;
      }
    }

    setSubmitting(true);

    try {
      saveWithdrawalRequest({
        userId: user.id,
        amount: amountNum,
        method: method === "eft" ? "EFT" : "Crypto",
        bankDetails:
          method === "eft"
            ? {
                bankName: bankDetails.bank_name,
                accountHolder: bankDetails.account_holder,
                accountNumber: bankDetails.account_number,
                branchCode: bankDetails.branch_code,
              }
            : undefined,
        walletAddress: method !== "eft" ? otherDetails : undefined,
        reason: reason || undefined,
      });

      toast.success("Withdrawal request submitted! We'll process it soon.");
      setAmount("");
      setMethod("eft");
      setReason("");
      setBankDetails({
        bank_name: "",
        account_holder: "",
        account_number: "",
        branch_code: "",
      });
      setOtherDetails("");
      onSuccess();
    } catch (err) {
      toast.error("Failed to submit withdrawal request");
      console.error("localStorage withdrawal error:", err);
    }

    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Available Balance</Label>
            <div className="text-3xl font-bold text-primary">
              R{availableBalance.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount to Withdraw (Min: R{MIN_WITHDRAWAL})
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={MIN_WITHDRAWAL}
              max={availableBalance}
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground">
              {amount && !isValidAmount
                ? `Please enter amount between R${MIN_WITHDRAWAL} and R${availableBalance.toLocaleString()}`
                : `Minimum withdrawal: R${MIN_WITHDRAWAL}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Withdrawal Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eft">EFT / Bank Transfer</SelectItem>
                <SelectItem value="other">Other (Wallet/Crypto)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {method === "eft" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="E.g., FNB, Standard Bank"
                  value={bankDetails.bank_name}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, bank_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_holder">Account Holder Name</Label>
                <Input
                  id="account_holder"
                  placeholder="Your full name"
                  value={bankDetails.account_holder}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      account_holder: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  placeholder="Your account number"
                  value={bankDetails.account_number}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      account_number: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch_code">Branch Code</Label>
                <Input
                  id="branch_code"
                  placeholder="Your branch code"
                  value={bankDetails.branch_code}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      branch_code: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address or Payment Details</Label>
              <Textarea
                id="wallet"
                placeholder="Enter your wallet address, crypto address, or other payment details"
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Withdrawal (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Tell us why you're withdrawing (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !isValidAmount}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Withdrawal Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
