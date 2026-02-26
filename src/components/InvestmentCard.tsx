import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, Clock, Coins, Copy, Upload, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import starterBunny from "@/assets/tier-starter-bunny.jpg";
import juniorHopper from "@/assets/tier-junior-hopper.jpg";
import silverRabbit from "@/assets/tier-silver-rabbit.jpg";
import goldRabbit from "@/assets/tier-gold-rabbit.jpg";
import platinumHare from "@/assets/tier-platinum-hare.jpg";
import diamondWarren from "@/assets/tier-diamond-warren.jpg";

interface InvestmentCardProps {
  amount: number;
  returnRate: number;
  days: number;
  index: number;
}

const tierNames = ["Starter Bunny", "Junior Hopper", "Silver Rabbit", "Gold Rabbit", "Platinum Hare", "Diamond Warren"];
const tierImages = [starterBunny, juniorHopper, silverRabbit, goldRabbit, platinumHare, diamondWarren];

export default function InvestmentCard({ amount, returnRate, days, index }: InvestmentCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const totalReturn = amount * (returnRate * days);
  const returnAmount = amount + totalReturn;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const handleInvest = async () => {
    if (!user) {
      toast.error("Please log in to confirm your investment");
      return navigate("/auth");
    }
    if (!file) {
      toast.error("Please upload proof of payment first");
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("proof-of-payment")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("investments").insert({
        user_id: user.id,
        amount,
        return_rate: returnRate,
        maturity_days: days,
        status: "pending",
        proof_of_payment: filePath,
      });
      if (error) throw error;

      toast.success("Investment submitted! Awaiting admin confirmation.");
      setFile(null);
      setExpanded(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create investment");
    } finally {
      setUploading(false);
    }
  };

  const handleInvestClick = () => {
    setExpanded((v) => !v);
  };

  return (
    <Card
      className="group relative overflow-hidden border-border/50 transition-all duration-300 hover:shadow-gold hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
      <div className="relative h-44 overflow-hidden">
        <img
          src={tierImages[index]}
          alt={tierNames[index]}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{tierNames[index]}</CardTitle>
          <Coins className="h-5 w-5 text-accent" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-4xl font-bold text-gradient-gold">R{amount.toLocaleString()}</span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>{(returnRate * 100).toFixed(0)}% daily return</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{days} days maturity</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent" />
            <span>Total Returns: <strong className="text-foreground">R{returnAmount.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Expandable banking + upload section */}
        {expanded && (
          <div className="space-y-3 border-t pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
              <h3 className="font-semibold text-sm">Payment Details</h3>
              <p className="text-xs text-muted-foreground">Transfer <strong>R{amount.toLocaleString()}</strong> to:</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Account Holder: <strong>E Roos</strong></span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard("E Roos")}><Copy className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bank: <strong>ABSA</strong></span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Account: <strong>4787692448351010</strong></span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard("4787692448351010")}><Copy className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Branch Code: <strong>632005</strong></span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard("632005")}><Copy className="h-3 w-3" /></Button>
                </div>
                <p className="text-muted-foreground pt-1">Reference: <strong>{user?.email}</strong></p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Upload className="h-3 w-3" /> Proof of Payment
              </h3>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer text-xs h-9"
              />
              {file && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {file.name}
                </p>
              )}
            </div>

            <Button
              className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold"
              size="sm"
              onClick={handleInvest}
              disabled={!file || uploading}
            >
              {uploading ? "Uploading..." : "Confirm Investment"}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gradient-forest text-primary-foreground hover:opacity-90"
          onClick={handleInvestClick}
        >
          {expanded ? (
            <><ChevronUp className="h-4 w-4" /> Hide Details</>
          ) : (
            <><ChevronDown className="h-4 w-4" /> Invest Now</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
