import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Coins, Ticket, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [raffleTickets, setRaffleTickets] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    const [inv, wd, rt, pr] = await Promise.all([
      supabase.from("investments").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      supabase.from("raffle_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setInvestments(inv.data || []);
    setWithdrawals(wd.data || []);
    setRaffleTickets(rt.data || []);
    setProfiles(pr.data || []);
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
    if (status === "processed") updates.processed_at = new Date().toISOString();
    await supabase.from("withdrawals").update(updates).eq("id", id);
    toast.success("Withdrawal updated");
    loadAll();
  };

  const updateTicketStatus = async (id: string, status: string) => {
    await supabase.from("raffle_tickets").update({ status }).eq("id", id);
    toast.success("Ticket updated");
    loadAll();
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
              {withdrawals.map((wd) => (
                <Card key={wd.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-semibold">R{Number(wd.amount).toLocaleString()}</span>
                      <Badge className="ml-2">{wd.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">User: {wd.user_id.slice(0, 8)}... • {new Date(wd.created_at).toLocaleDateString()}</p>
                    </div>
                    <Select onValueChange={(v) => updateWithdrawalStatus(wd.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Update" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
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
