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

  const updateWithdrawalStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "processed") updates.processed_at = new Date().toISOString();
    
    const { error } = await supabase.from("withdrawals").update(updates).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    
    toast.success("Withdrawal updated. Investment remains active.");
    loadAll();
  };

  // ... (Keep other update functions like updateInvestmentStatus the same)

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

        <Tabs defaultValue="withdrawals">
          <TabsList className="mb-4">
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.filter(w=>w.status==='pending').length} Pending)</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            {withdrawals.length === 0 && <p>No requests.</p>}
            {withdrawals.map((wd) => {
              const userProfile = profiles.find(p => p.user_id === wd.user_id);
              const userBank = bankingDetails.find(b => b.user_id === wd.user_id);
              return (
                <Card key={wd.id}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-bold">R{Number(wd.amount).toLocaleString()}</p>
                        <Badge variant={wd.status === 'processed' ? 'default' : 'outline'}>{wd.status}</Badge>
                        <p className="text-sm font-medium">{userProfile?.full_name}</p>
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
                      <p className="text-xs text-destructive font-bold">MISSING BANK DETAILS</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          {/* ... Rest of your existing TabsContent for investments, raffle, etc ... */}
        </Tabs>
      </div>
    </div>
  );
}
