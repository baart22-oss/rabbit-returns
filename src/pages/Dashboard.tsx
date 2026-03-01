import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import WithdrawalForm from "@/components/WithdrawalForm";
import WithdrawalHistory from "@/components/WithdrawalHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, Wallet, Ticket, Copy, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { getUserWithdrawalRequests, type WithdrawalRequest } from "@/lib/withdrawalStorage";

export default function Dashboard() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);
  const [raffleTickets, setRaffleTickets] = useState<any[]>([]);
  const [banking, setBanking] = useState<any>(null);
  const [bankForm, setBankForm] = useState({ bank_name: "", account_holder: "", account_number: "", branch_code: "" });
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [localWithdrawals, setLocalWithdrawals] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [invRes, rtRes, bkRes, profRes, commRes, wrRes] = await Promise.all([
      supabase.from("investments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("raffle_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("banking_details").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("referral_commissions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setInvestments(invRes.data || []);
    setRaffleTickets(rtRes.data || []);
    if (bkRes.data) { setBanking(bkRes.data); setBankForm(bkRes.data); }
    setProfile(profRes.data);
    setCommissions(commRes.data || []);
    setWithdrawalRequests(wrRes.data || []);
    setLocalWithdrawals(getUserWithdrawalRequests(user!.id));

    if (profRes.data?.referral_code) {
      const { data: refs } = await supabase.from("profiles").select("*").eq("referred_by", profRes.data.referral_code);
      setReferredUsers(refs || []);
    }
  };

  const saveBanking = async () => {
    if (!bankForm.bank_name || !bankForm.account_holder || !bankForm.account_number || !bankForm.branch_code) {
      toast.error("Please fill all banking fields");
      return;
    }
    setSaving(true);
    const { error } = banking 
      ? await supabase.from("banking_details").update(bankForm).eq("user_id", user!.id)
      : await supabase.from("banking_details").insert({ ...bankForm, user_id: user!.id });
    
    if (error) toast.error("Failed to save");
    else { toast.success("Banking details saved!"); loadData(); }
    setSaving(false);
  };

  const getDaysElapsed = (inv: any) => {
    if (!inv.started_at || inv.status === 'pending') return 0;
    const start = new Date(inv.started_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff, Number(inv.maturity_days));
  };

  const getAccumulatedEarnings = (inv: any) => {
    return Number(inv.amount) * Number(inv.return_rate) * getDaysElapsed(inv);
  };

  const getAvailableToWithdraw = (inv: any) => {
    const totalEarned = getAccumulatedEarnings(inv);
    const withdrawnOrPending = withdrawalRequests
      .filter(w => w.investment_id === inv.id && w.status !== "rejected")
      .reduce((sum, w) => sum + Number(w.amount), 0);
    return Math.max(0, totalEarned - withdrawnOrPending);
  };

  const requestWithdrawal = async (inv: any) => {
    if (!banking) { toast.error("Please add your banking details first"); return; }
    const amount = getAvailableToWithdraw(inv);
    if (amount < 10) { toast.error("Minimum withdrawal is R10"); return; }
    
    setRequesting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      investment_id: inv.id,
      amount: amount,
      method: "Quick Withdrawal",
      details: {
        type: "earnings_withdrawal",
        investment_id: inv.id,
      },
      status: "pending"
    });

    if (error) toast.error("Request failed");
    else { toast.success("Withdrawal requested!"); loadData(); }
    setRequesting(false);
  };

  const requestBonusWithdrawal = async () => {
    if (!banking) { toast.error("Please add your banking details first"); return; }
    const paidCommissions = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
    const withdrawnBonus = withdrawalRequests.filter(w => w.investment_id === null && w.status !== "rejected").reduce((sum, w) => sum + Number(w.amount), 0);
    const available = paidCommissions - withdrawnBonus;

    if (available < 10) { toast.error("No available bonus to withdraw (Min R10)"); return; }

    setRequesting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      investment_id: null,
      amount: available,
      method: "Bonus Withdrawal",
      details: {
        type: "referral_bonus",
      },
      status: "pending"
    });
    if (error) toast.error("Request failed");
    else { toast.success("Bonus withdrawal requested!"); loadData(); }
    setRequesting(false);
  };

  const totalAccumulated = investments.reduce((sum, i) => sum + getAccumulatedEarnings(i), 0);
  const totalWithdrawn = withdrawalRequests.filter(w => w.status === "processed").reduce((sum, w) => sum + Number(w.amount), 0);

  const getAvailableBalance = () => {
    const earnedFromInvestments = investments.reduce((sum, i) => sum + getAvailableToWithdraw(i), 0);
    const paidCommissions = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
    const withdrawnBonus = withdrawalRequests.filter(w => w.investment_id === null && w.status !== "rejected").reduce((sum, w) => sum + Number(w.amount), 0);
    const bonusAvailable = paidCommissions - withdrawnBonus;
    return earnedFromInvestments + bonusAvailable;
  };

  const availableBalance = getAvailableBalance();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">My Dashboard</h1>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="flex items-center gap-4 p-6"><Coins className="h-10 w-10 text-primary" />
            <div><p className="text-sm text-muted-foreground">Invested</p><p className="text-2xl font-bold">R{investments.reduce((s,i)=>s+Number(i.amount),0).toLocaleString()}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6"><TrendingUp className="h-10 w-10 text-accent" />
            <div><p className="text-sm text-muted-foreground">Total Earnings</p><p className="text-2xl font-bold">R{totalAccumulated.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6"><Wallet className="h-10 w-10 text-secondary" />
            <div><p className="text-sm text-muted-foreground">Withdrawn</p><p className="text-2xl font-bold">R{totalWithdrawn.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6"><Users className="h-10 w-10 text-primary" />
            <div><p className="text-sm text-muted-foreground">Referrals</p><p className="text-2xl font-bold">{referredUsers.length}</p></div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="investments">
          <TabsList className="mb-6">
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw Funds</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawal History</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="space-y-4">
            {investments.map((inv) => {
              const available = getAvailableToWithdraw(inv);
              const earned = getAccumulatedEarnings(inv);
              return (
                <Card key={inv.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">R{Number(inv.amount).toLocaleString()}</span>
                          <Badge variant={inv.status === 'active' ? 'default' : 'secondary'}>{inv.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Earned so far: <span className="text-accent font-bold">R{earned.toLocaleString()}</span></p>
                        <p className="text-xs text-muted-foreground">Day {getDaysElapsed(inv)} of {inv.maturity_days}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {available >= 10 && inv.status !== 'pending' && (
                          <Button size="sm" onClick={() => requestWithdrawal(inv)} disabled={requesting}>
                            Withdraw R{available.toLocaleString()}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <WithdrawalForm
              availableBalance={availableBalance}
              onSuccess={loadData}
            />
          </TabsContent>

          <TabsContent value="withdrawals">
            <WithdrawalHistory requests={localWithdrawals} />
          </TabsContent>

          <TabsContent value="banking">
            <Card>
              <CardHeader><CardTitle>Banking Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={bankForm.bank_name} onChange={e=>setBankForm({...bankForm, bank_name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Account Holder</Label><Input value={bankForm.account_holder} onChange={e=>setBankForm({...bankForm, account_holder: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Account Number</Label><Input value={bankForm.account_number} onChange={e=>setBankForm({...bankForm, account_number: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Branch Code</Label><Input value={bankForm.branch_code} onChange={e=>setBankForm({...bankForm, branch_code: e.target.value})} /></div>
                </div>
                <Button onClick={saveBanking} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Details"}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
