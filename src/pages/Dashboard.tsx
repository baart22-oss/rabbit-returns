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
import { Coins, Wallet, Ticket, CreditCard } from "lucide-react";
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

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [invRes, wdRes, rtRes, bkRes] = await Promise.all([
      supabase.from("investments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("raffle_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("banking_details").select("*").eq("user_id", user!.id).maybeSingle(),
    ]);
    setInvestments(invRes.data || []);
    setWithdrawals(wdRes.data || []);
    setRaffleTickets(rtRes.data || []);
    if (bkRes.data) {
      setBanking(bkRes.data);
      setBankForm(bkRes.data);
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
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const requestWithdrawal = async (investment: any) => {
    if (!banking) {
      toast.error("Please add your banking details first");
      return;
    }
    const amount = investment.amount * (1 + investment.return_rate);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user!.id,
      investment_id: investment.id,
      amount,
    });
    if (error) {
      toast.error("Failed to request withdrawal");
    } else {
      toast.success("Withdrawal requested!");
      loadData();
    }
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

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalReturns = investments.filter(i => i.status === "matured" || i.status === "active").reduce((sum, i) => sum + Number(i.amount) * Number(i.return_rate), 0);

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
              <Wallet className="h-10 w-10 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Expected Returns</p>
                <p className="text-2xl font-bold">R{totalReturns.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Ticket className="h-10 w-10 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Raffle Tickets</p>
                <p className="text-2xl font-bold">{raffleTickets.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <CreditCard className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Banking</p>
                <p className="text-2xl font-bold">{banking ? "✓ Saved" : "Not set"}</p>
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
          <TabsList className="mb-4">
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="banking">Banking Details</TabsTrigger>
          </TabsList>

          <TabsContent value="investments">
            {investments.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No investments yet. <Link to="/#packages" className="text-primary hover:underline">Start investing!</Link></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => (
                  <Card key={inv.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">R{Number(inv.amount).toLocaleString()}</span>
                          <Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Return: R{(Number(inv.amount) * (1 + Number(inv.return_rate))).toLocaleString()} • {inv.maturity_days} days
                        </p>
                        <p className="text-xs text-muted-foreground">Created: {new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                      {inv.status === "matured" && (
                        <Button size="sm" variant="outline" onClick={() => requestWithdrawal(inv)}>
                          Request Withdrawal
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="withdrawals">
            {withdrawals.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No withdrawal requests yet.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((wd) => (
                  <Card key={wd.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <span className="font-semibold">R{Number(wd.amount).toLocaleString()}</span>
                        <Badge variant="outline" className="ml-2">{wd.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Requested: {new Date(wd.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="banking">
            <Card>
              <CardHeader>
                <CardTitle>Your Banking Details</CardTitle>
              </CardHeader>
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
