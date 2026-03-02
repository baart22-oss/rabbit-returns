import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AdminWithdrawalPanel from "@/components/AdminWithdrawalPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { getAllWithdrawalRequests, type WithdrawalRequest } from "@/lib/withdrawalStorage";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [localWithdrawalRequests, setLocalWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    const [inv, wd] = await Promise.all([
      apiFetch<any[]>('/admin/investments'),
      apiFetch<any[]>('/admin/withdrawals'),
    ]);
    setInvestments(inv.data || []);
    setWithdrawals(wd.data || []);
    setLocalWithdrawalRequests(getAllWithdrawalRequests());
  };

  const updateWithdrawalStatus = async (id: string, status: string) => {
    const { error } = await apiFetch(`/admin/withdrawals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (error) { toast.error("Update failed"); return; }
    toast.success("Withdrawal updated.");
    loadAll();
  };

  if (loading) return <div>Loading...</div>;
  if (!isAdmin && !loading) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

        <Tabs defaultValue="withdrawals">
          <TabsList className="mb-4">
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.filter((w: any) => w.status === 'pending').length} Pending)</TabsTrigger>
            <TabsTrigger value="local-withdrawals">Local Withdrawals ({localWithdrawalRequests.filter(w => w.status === 'pending').length} Pending)</TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="space-y-4">
            {investments.length === 0 && <p>No investments.</p>}
            {investments.map((inv: any) => (
              <Card key={inv._id}>
                <CardContent className="p-4">
                  <p className="font-bold">R{Number(inv.amount).toLocaleString()}</p>
                  <Badge>{inv.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            {withdrawals.length === 0 && <p>No requests.</p>}
            {withdrawals.map((wd: any) => (
              <Card key={wd._id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-bold">R{Number(wd.amount).toLocaleString()}</p>
                      <Badge variant={wd.status === 'processed' ? 'default' : 'outline'}>{wd.status}</Badge>
                      <p className="text-sm font-medium">{wd.user?.email}</p>
                    </div>
                    <Select onValueChange={(v) => updateWithdrawalStatus(wd._id, v)}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Update" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {wd.bankDetails && (
                    <div className="rounded bg-muted p-3 text-xs grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground font-semibold">Bank:</span> {wd.bankDetails.bankName}</div>
                      <div><span className="text-muted-foreground font-semibold">Account:</span> {wd.bankDetails.accountNumber}</div>
                      <div><span className="text-muted-foreground font-semibold">Holder:</span> {wd.bankDetails.accountHolder}</div>
                      <div><span className="text-muted-foreground font-semibold">Branch:</span> {wd.bankDetails.branchCode}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="local-withdrawals">
            <AdminWithdrawalPanel
              requests={localWithdrawalRequests}
              onRefresh={() => setLocalWithdrawalRequests(getAllWithdrawalRequests())}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
