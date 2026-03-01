import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, Wallet, Ticket, Copy, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [raffleTickets, setRaffleTickets] = useState<any[]>([]);
  const [banking, setBanking] = useState<any>(null);
  const [bankForm, setBankForm] = useState({ bank_name: "", account_holder: "", account_number: "", branch_code: "" });
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [requestingBonus, setRequestingBonus] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [invRes, wdRes, rtRes, bkRes, profRes, commRes] = await Promise.all([
      supabase.from("investments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("raffle_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("banking_details").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("referral_commissions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setInvestments(invRes.data || []);
    setWithdrawals(wdRes.data || []);
    setRaffleTickets(rtRes.data || []);
    if (bkRes.data) { setBanking(bkRes.data); setBankForm(bkRes.data); }
    const prof = profRes.data;
    setProfile(prof);
    setCommissions(commRes.data || []);

    // Load referred users using this user's referral code
    if (prof?.referral_code) {
      const { data: refs } = await supabase
        .from("profiles")
        .select("user_id, full_name, created_at, referral_code")
        .eq("referred_by", prof.referral_code)
        .order("created_at", { ascending: false });
      setReferredUsers(refs || []);
    }
  };

  const saveBanking = async () => {
    if (!bankForm.bank_name || !bankForm.account_holder || !bankForm.account_number || !bankForm.branch_code) {
      toast.error("Please fill all banking fields");
      return;
    }
    setSaving(true);
    try {
      if (banking) {
        await supabase.from("banking_details").update(bankForm).eq("user_id", user!.id);
      } else {
        await supabase.from("banking_details").insert({ ...bankForm, user_id: user!.id });
      }
      toast.success("Banking details saved!");
      loadData();
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const requestWithdrawal = async (investment: any) => {
    if (!banking) { toast.error("Please add your banking details first"); return; }
    // Check if withdrawal already requested for this investment
    const existing = withdrawals.find(w => w.investment_id === investment.id && w.status !== "rejected");
    if (existing) { toast.error("Withdrawal already requested for this investment"); return; }
    const totalReturn = Number(investment.amount) * Number(investment.return_rate) * Number(investment.maturity_days);
    const amount = Number(investment.amount) + totalReturn;
    const { error } = await supabase.from("withdrawals").insert({ user_id: user!.id, investment_id: investment.id, amount });
    if (error) { toast.error("Failed to request withdrawal"); }
    else { toast.success("Withdrawal requested! Admin will process it shortly."); loadData(); }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const copyReferralLink = () => {
    if (profile?.referral_code) {
      const link = `${window.location.origin}/auth?ref=${profile.referral_code}`;
      navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
    }
  };

  const requestBonusWithdrawal = async () => {
    if (!banking) { toast.error("Please add your banking details first"); return; }
    const pendingBonus = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
    const alreadyRequested = withdrawals.filter(w => w.investment_id === null && w.status !== "rejected").reduce((sum, w) => sum + Number(w.amount), 0);
    const available = pendingBonus - alreadyRequested;
    if (available <= 0) { toast.error("No available bonus to withdraw"); return; }
    setRequestingBonus(true);
    const { error } = await supabase.from("withdrawals").insert({ user_id: user!.id, investment_id: null, amount: available });
    if (error) toast.error("Failed to request withdrawal");
    else { toast.success(`Withdrawal of R${available.toLocaleString()} requested!`); loadData(); }
    setRequestingBonus(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "default";
      case "matured": return "secondary";
      case "pending": return "outline";
      case "withdrawn": return "destructive";
      default: return "outline" as const;
    }
  };

  const getDaysElapsed = (inv: any) => {
    if (!inv.started_at) return 0;
    const start = new Date(inv.started_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff, Number(inv.maturity_days));
  };

  const getAccumulatedEarnings = (inv: any) => {
    const days = getDaysElapsed(inv);
    return Number(inv.amount) * Number(inv.return_rate) * days;
  };

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalAccumulatedEarnings = investments
    .filter(i => i.status === 'active' || i.status === 'matured')
    .reduce((sum, i) => sum + getAccumulatedEarnings(i), 0);
  const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const paidCommissions = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
  const bonusWithdrawals = withdrawals.filter(w => w.investment_id === null && w.status !== "rejected").reduce((sum, w) => sum + Number(w.amount), 0);
  const availableBonus = Math.max(0, paidCommissions - bonusWithdrawals);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Coins className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">R{totalInvested.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <TrendingUp className="h-10 w-10 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Accumulated Earnings</p>
                <p className="text-2xl font-bold">R{totalAccumulatedEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Users className="h-10 w-10 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Referral Earnings</p>
                <p className="text-2xl font-bold">R{totalCommissions.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Ticket className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Raffle Tickets</p>
                <p className="text-2xl font-bold">{raffleTickets.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="mb-8 flex gap-3">
          <Link to="/#packages">
            <Button className="bg-gradient-forest text-primary-foreground">New Investment</Button>
          </Link>
          <Link to="/raffle">
            <Button variant="outline">Buy Raffle Ticket</Button>
          </Link>
        </div>

        <Tabs defaultValue="investments">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="banking">Banking Details</TabsTrigger>
          </TabsList>

          <TabsContent value="investments">
            {investments.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No investments yet. <Link to="/#packages" className="text-primary hover:underline">Start investing!</Link></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => {
                  const totalReturn = Number(inv.amount) * Number(inv.return_rate) * Number(inv.maturity_days);
                  const payout = Number(inv.amount) + totalReturn;
                  const daysElapsed = getDaysElapsed(inv);
                  const earned = getAccumulatedEarnings(inv);
                  const progressPct = inv.maturity_days > 0 ? Math.round((daysElapsed / Number(inv.maturity_days)) * 100) : 0;
                  return (
                    <Card key={inv.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">R{Number(inv.amount).toLocaleString()}</span>
                            <Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge>
                          </div>
                          {inv.status === "matured" && (
                            <Button size="sm" variant="outline" onClick={() => requestWithdrawal(inv)}>
                              Request Withdrawal
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="rounded bg-muted p-2 text-center">
                            <p className="text-xs text-muted-foreground">Invested</p>
                            <p className="font-bold">R{Number(inv.amount).toLocaleString()}</p>
                          </div>
                          <div className="rounded bg-accent/10 p-2 text-center">
                            <p className="text-xs text-muted-foreground">Earned so far</p>
                            <p className="font-bold text-accent">R{earned.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                          </div>
                          <div className="rounded bg-primary/10 p-2 text-center">
                            <p className="text-xs text-muted-foreground">Total Payout</p>
                            <p className="font-bold text-primary">R{payout.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Day {daysElapsed} of {inv.maturity_days}</span>
                            <span>{progressPct}% complete</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Started: {inv.started_at ? new Date(inv.started_at).toLocaleDateString() : "Pending activation"}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="withdrawals">
            <div className="space-y-4">
              {/* Matured investments ready to withdraw */}
              {investments.filter(i => i.status === "matured").map((inv) => {
                const totalReturn = Number(inv.amount) * Number(inv.return_rate) * Number(inv.maturity_days);
                const payout = Number(inv.amount) + totalReturn;
                const alreadyRequested = withdrawals.find(w => w.investment_id === inv.id && w.status !== "rejected");
                return (
                  <Card key={inv.id} className="border-accent/40">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-accent">Investment Matured 🎉</p>
                          <p className="text-sm text-muted-foreground">Principal: R{Number(inv.amount).toLocaleString()} + Returns: R{totalReturn.toLocaleString()}</p>
                          <p className="text-lg font-bold text-primary mt-1">Total Payout: R{payout.toLocaleString()}</p>
                        </div>
                        {alreadyRequested ? (
                          <Badge variant="outline">{alreadyRequested.status}</Badge>
                        ) : (
                          <Button size="sm" onClick={() => requestWithdrawal(inv)} disabled={!banking}>
                            Request Withdrawal
                          </Button>
                        )}
                      </div>
                      {!banking && <p className="text-xs text-destructive mt-2">Add banking details first</p>}
                    </CardContent>
                  </Card>
                );
              })}

              {/* All withdrawal requests */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Withdrawal Requests</CardTitle></CardHeader>
                <CardContent>
                  {withdrawals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No withdrawal requests yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map((wd) => {
                        const isBonus = wd.investment_id === null;
                        const statusVariant = wd.status === "processed" ? "default" : wd.status === "rejected" ? "destructive" : "outline";
                        return (
                          <div key={wd.id} className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">R{Number(wd.amount).toLocaleString()}</span>
                                <Badge variant={statusVariant as any}>{wd.status}</Badge>
                                {isBonus && <Badge variant="secondary" className="text-xs">Referral Bonus</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Requested: {new Date(wd.created_at).toLocaleDateString()}
                                {wd.processed_at && ` • Processed: ${new Date(wd.processed_at).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referrals">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Your Referral Code</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                    <span className="text-2xl font-bold tracking-widest text-primary">{profile?.referral_code || "Loading..."}</span>
                    <Button variant="ghost" size="sm" onClick={copyReferralCode}><Copy className="h-4 w-4" /></Button>
                  </div>
                  <Button variant="outline" onClick={copyReferralLink} className="gap-2">
                    <Copy className="h-4 w-4" /> Copy Referral Link
                  </Button>
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-2 text-sm">
                    <h4 className="font-semibold">Commission Structure</h4>
                    <div className="flex justify-between"><span className="text-muted-foreground">Level 1 (Direct referrals)</span><strong className="text-primary">5%</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Level 2</span><strong className="text-primary">3%</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Level 3</span><strong className="text-primary">1%</strong></div>
                  </div>
                </CardContent>
              </Card>

              {/* Bonus withdrawal card */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-accent" /> Referral Bonus Balance</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-muted-foreground text-xs">Total Earned</p>
                      <p className="font-bold text-lg text-primary">R{totalCommissions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-muted-foreground text-xs">Paid Out</p>
                      <p className="font-bold text-lg">R{paidCommissions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-accent/10 border border-accent/30 p-3 text-center">
                      <p className="text-muted-foreground text-xs">Available</p>
                      <p className="font-bold text-lg text-accent">R{availableBonus.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button
                    onClick={requestBonusWithdrawal}
                    disabled={requestingBonus || availableBonus <= 0}
                    className="w-full bg-gradient-forest text-primary-foreground"
                  >
                    {requestingBonus ? "Requesting..." : availableBonus > 0 ? `Withdraw R${availableBonus.toLocaleString()} Bonus` : "No Bonus Available"}
                  </Button>
                  {!banking && <p className="text-xs text-muted-foreground text-center">Add your banking details first to enable withdrawals.</p>}
                </CardContent>
              </Card>

              {/* People you referred */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-secondary" /> People You Referred ({referredUsers.length})</CardTitle></CardHeader>
                <CardContent>
                  {referredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No referrals yet. Share your code to earn commissions!</p>
                  ) : (
                    <div className="space-y-2">
                      {referredUsers.map((u, i) => (
                        <div key={u.user_id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">{i + 1}</div>
                            <div>
                              <span className="font-medium">{u.full_name || "Anonymous User"}</span>
                              <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">Level 1</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Commission History</CardTitle></CardHeader>
                <CardContent>
                  {commissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No commissions yet. Share your referral code to earn!</p>
                  ) : (
                    <div className="space-y-2">
                      {commissions.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                          <div>
                            <span className="font-medium">Level {c.level} Commission</span>
                            <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-primary">+R{Number(c.amount).toLocaleString()}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{c.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="banking">
            <Card>
              <CardHeader><CardTitle>Your Banking Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} placeholder="e.g. ABSA" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Holder</Label>
                    <Input value={bankForm.account_holder} onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })} placeholder="Full Name" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} placeholder="Account number" maxLength={30} />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch Code</Label>
                    <Input value={bankForm.branch_code} onChange={(e) => setBankForm({ ...bankForm, branch_code: e.target.value })} placeholder="e.g. 632005" maxLength={10} />
                  </div>
                </div>
                <Button onClick={saveBanking} disabled={saving} className="bg-gradient-forest text-primary-foreground">
                  {saving ? "Saving..." : banking ? "Update Banking Details" : "Save Banking Details"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
