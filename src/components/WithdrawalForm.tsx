import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/client";

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

  const MIN_WITHDRAWAL = 60;
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount =
    amountNum >= MIN_WITHDRAWAL && amountNum <= availableBalance;

  // Try to load user's saved banking details and prefill the form
  useEffect(() => {
    async function load() {
      try {
        const b = await api.banking.get().catch(() => null);
        if (b) {
          setBankDetails({
            bank_name: b.bankName ?? "",
            account_holder: b.accountHolder ?? "",
            account_number: b.accountNumber ?? "",
            branch_code: b.branchCode ?? "",
          });
        }
      } catch (err) {
        // ignore
      }
    }
    load();
  }, []);

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
      const payload: any = {
        amountRand: Number(amountNum),
        bankName: bankDetails.bank_name,
        accountHolder: bankDetails.account_holder,
        accountNumber: bankDetails.account_number,
        branchCode: bankDetails.branch_code,
        accountType: method === "eft" ? "CHEQUE" : "CRYPTO",
      };

      if (method !== "eft") {
        // server expects bank fields for EFT; for crypto we still pass placeholder bank fields
        payload.bankName = payload.bankName || "N/A";
        payload.accountHolder = payload.accountHolder || user.profile?.fullName || user.email;
        payload.accountNumber = payload.accountNumber || otherDetails;
        payload.branchCode = payload.branchCode || "000000";
        payload.accountType = "CRYPTO";
      }

      const res = await api.withdrawals.submit(payload);
      toast.success("Withdrawal request submitted! We'll process it soon.");
      setAmount("");
      setMethod("eft");
      setReason("");
      onSuccess();
    } catch (err: any) {
      console.error("Withdrawal submit failed", err);
      toast.error(err?.message || "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
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
            <div className="text-3xl font-bold">R{availableBalance.toLocaleString()}</div>
          </div>

          <div>
            <Label>Amount (ZAR)</Label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2"
            />
          </div>

          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={(val) => setMethod(val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eft">EFT / Bank Transfer</SelectItem>
                <SelectItem value="crypto">Crypto / Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {method === "eft" ? (
            <>
              <div>
                <Label>Account holder</Label>
                <input
                  value={bankDetails.account_holder}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>
              <div>
                <Label>Bank name</Label>
                <input
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>
              <div>
                <Label>Account number</Label>
                <input
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>
              <div>
                <Label>Branch code</Label>
                <input
                  value={bankDetails.branch_code}
                  onChange={(e) => setBankDetails({ ...bankDetails, branch_code: e.target.value })}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>
            </>
          ) : (
            <div>
              <Label>Wallet / Payment details</Label>
              <Textarea value={otherDetails} onChange={(e) => setOtherDetails(e.target.value)} />
            </div>
          )}

          <div>
            <Label>Reason (optional)</Label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mt-1 border rounded px-3 py-2" />
          </div>

          <div>
            <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-2 rounded">
              {submitting ? "Submitting…" : "Request Withdrawal"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
