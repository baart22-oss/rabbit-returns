import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import rabbitInvest from "@/assets/rabbit-invest.jpg";

export default function InvestPage() {
  const { amount } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const investAmount = Number(amount);
  const dailyRate = 0.02;
  const maturityDays = 180;
  const totalReturn = investAmount * dailyRate * maturityDays;
  const returnAmount = investAmount + totalReturn;

  const handleInvest = async () => {
    if (!user) return navigate("/auth");
    const { error } = await supabase.from("investments").insert({
      user_id: user.id,
      amount: investAmount,
      return_rate: 0.02,
      maturity_days: maturityDays,
      status: "pending",
    });
    if (error) {
      toast.error("Failed to create investment");
    } else {
      toast.success("Investment created! Please make payment and upload proof.");
      navigate("/dashboard");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="grid gap-6">
          <Card className="overflow-hidden">
            <img src={rabbitInvest} alt="Investment rabbit" className="h-48 w-full object-cover" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-accent" /> Invest R{investAmount.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Investment:</span><strong>R{investAmount.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Daily Return Rate:</span><strong>2% per day</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Maturity:</span><strong>{maturityDays} days</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Profit:</span><strong>R{totalReturn.toLocaleString()}</strong></div>
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Total Payout:</span><strong className="text-primary">R{returnAmount.toLocaleString()}</strong></div>
              </div>

              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
                <h3 className="font-semibold">Payment Details</h3>
                <p className="text-sm text-muted-foreground">Transfer the investment amount to:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Account Holder: <strong>E Roos</strong></span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("E Roos")}><Copy className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bank: <strong>ABSA</strong></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Account: <strong>4787692448351010</strong></span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("4787692448351010")}><Copy className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Branch Code: <strong>632005</strong></span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("632005")}><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Use your email as payment reference: <strong>{user?.email}</strong></p>
              </div>

              <Button className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold" size="lg" onClick={handleInvest}>
                Confirm Investment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
