import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Coins, Ticket, Wallet, HandCoins, FileCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [raffleTickets, setRaffleTickets] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [bankingDetails, setBankingDetails] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    const [inv, wd, rt, pr, cm, bd] = await Promise.all([
      supabase.from("investments").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      supabase.from("raffle_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("referral_commissions").select("*").order("created_at", { ascending: false }),
      supabase.from("banking_details").select("*"),
    ]);
    setInvestments(inv.data || []);
    setWithdrawals(wd.data || []);
    setRaffleTickets(rt.data || []);
    setProfiles(pr.data || []);
    setCommissions(cm.data || []);
    setBankingDetails(bd.data || []);
  };

  const updateInvestmentStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "active") {
      updates.started_at = new Date().toISOString();
      updates.matures_at = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    }
    await supabase.from("investments").update(updates).eq("id", id);
    toast.success("Investment updated");
    loadAll();
  };

  const updateWithdrawalStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "processed") {
      updates.processed_at = new Date().toISOString();
    }
    
    const { error } = await supabase.from("withdrawals").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    
    // Logic updated: We no longer update investment status to "withdrawn".
    // This allows investments to keep earning.
    
    toast.success("Withdrawal updated");
    loadAll();
  };

  const updateTicketStatus = async (id: string, status: string) => {
    await supabase.from("raffle_tickets").update({ status }).eq("id", id);
    toast.success("Ticket updated");
    loadAll();
  };

  const updateCommissionStatus = async (id: string, status: string) => {
    await supabase.from("referral_commissions").update({ status }).eq("id", id);
    toast.success("Commission updated");
    loadAll();
  };

  const viewProof = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("proof-of-payment")
      .createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) {
      toast.error("Could not load proof of payment");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0);
  const activeInvestments = investments.filter(i => i.status === "active").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="flex items-center gap-4 p-6"><Users className="h-10 w-10 text-primary" /><div><p className="text-sm text-muted-foreground">Users</p><p className="text-2xl font-bold">{profiles.length}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6"><Coins className="h-10 w-10 text-accent" /><div><p className="text-sm text-muted-foreground">Total Invested</p><p className="text-2xl font-bold">R{totalInvested.toLocaleString()}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6"><Wallet className="h-10 w-10 text-secondary" /><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{activeInvestments}</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6"><Ticket className="h-10 w-10 text-primary" /><div><p className="text-sm text-muted-foreground">Raffle Tickets</p><p className="text-2xl font-bold">{raffleTickets.length}</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="investments">
          <TabsList className="mb-4">
            <TabsTrigger value="investments">Investments ({investments.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
            <TabsTrigger value="raffle">Raffle ({raffleTickets.length})</TabsTrigger>
            <TabsTrigger value="commissions">Commissions ({commissions.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({profiles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="investments">
            <div className="space-y-3">
              {investments.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">R{Number(inv.amount).toLocaleString()}</span>
                        <Badge>{inv.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">User: {inv.user_id.slice(0, 8)}... • {new Date(inv.created_at).toLocaleDateString()}</p>
                      {inv.proof_of_payment && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1" onClick={() => viewProof(inv.proof_of_payment)}>
                          <FileCheck className="h-3 w-3" /> View Proof of Payment <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Select onValueChange={(v) => updateInvestmentStatus(inv.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Update" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="matured">Matured</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="withdrawals">
            <div className="space-y-3">
              {withdrawals.length === 0 && <p className="text-muted-foreground text-sm">No requests.</p>}
              {withdrawals.map((wd) => {
                const isBonus = wd.investment_id === null;
                const userProfile = profiles.find(p => p.user_id === wd.user_id);
                const userBank = bankingDetails.find(b => b.user_id === wd.user_id);
                return (
                  <Card key={wd.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">R{Number(wd.amount).toLocaleString()}</span>
                            <Badge variant={wd.status === "processed" ? "default" : "outline"}>{wd.status}</Badge>
                            {isBonus ? <Badge variant="secondary">Bonus</Badge> : <Badge variant="outline">Investment</Badge>}
                          </div>
                          <p className="text-sm font-medium">{userProfile?.full_name || "Unnamed User"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(wd.created_at).toLocaleString()}</p>
                        </div>
                        <Select onValueChange={(v) => updateWithdrawalStatus(wd.id, v)}>
                          <SelectTrigger className="w-36"><SelectValue placeholder="Update" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {userBank ? (
                        <div className="rounded bg-muted p-3 text-xs grid grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground font-semibold">Bank:</span> {userBank.bank_name}</div>
                          <div><span className="text-muted-foreground font-semibold">Account:</span> {userBank.account_number}</div>
                          <div><span className="text-muted-foreground font-semibold">Holder:</span> {userBank.account_holder}</div>
                          <div><span className="text-muted-foreground font-semibold">Branch:</span> {userBank.branch_code}</div>
                        </div>
                      ) : (
                        <p className="text-xs text-destructive">User has not added banking details.</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="raffle">
            <div className="space-y-3">
              {raffleTickets.map((t) => (
                <Card key={t.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-semibold">Ticket #{t.ticket_number}</span>
                      <Badge className="ml-2">{t.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">User: {t.user_id.slice(0, 8)}...</p>
                      {t.proof_of_payment && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1" onClick={() => viewProof(t.proof_of_payment)}>
                          <FileCheck className="h-3 w-3" /> View Proof of Payment <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Select onValueChange={(v) => updateTicketStatus(t.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Update" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="winner">Winner</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="commissions">
            <div className="space-y-3">
              {commissions.length === 0 && <p className="text-muted-foreground text-sm">No commissions yet.</p>}
              {commissions.map((c) => {
                const referrerProfile = profiles.find(p => p.user_id === c.user_id);
                return (
                  <Card key={c.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <HandCoins className="h-4 w-4 text-accent" />
                          <span className="font-semibold">R{Number(c.amount).toLocaleString()}</span>
                          <Badge variant={c.status === "paid" ? "default" : "secondary"}>{c.status}</Badge>
                          <Badge variant="outline">Level {c.level}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          To: {referrerProfile?.full_name || c.user_id.slice(0, 8) + "..."} • Rate: {(Number(c.rate) * 100).toFixed(0)}% • {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Select onValueChange={(v) => updateCommissionStatus(c.id, v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="Update" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-3">
              {profiles.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-semibold">{p.full_name || "Unnamed"}</span>
                      <p className="text-xs text-muted-foreground">ID: {p.user_id.slice(0, 8)}... • Joined: {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
