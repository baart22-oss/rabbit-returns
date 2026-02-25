import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Ticket, Copy, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import rabbitRaffle from "@/assets/rabbit-raffle.jpg";

const TOTAL_TICKETS = 500;
const TICKET_PRICE = 50;

export default function RafflePage() {
  const { user } = useAuth();
  const [soldCount, setSoldCount] = useState(0);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [buying, setBuying] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const { count } = await supabase.from("raffle_tickets").select("*", { count: "exact", head: true });
    setSoldCount(count || 0);
    if (user) {
      const { data } = await supabase.from("raffle_tickets").select("*").eq("user_id", user.id);
      setMyTickets(data || []);
    }
  };

  const buyTicket = async () => {
    if (!user) return;
    if (!file) {
      toast.error("Please upload proof of payment first");
      return;
    }
    setBuying(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("proof-of-payment")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const ticketNumber = Math.floor(Math.random() * TOTAL_TICKETS) + 1;
      const { error } = await supabase.from("raffle_tickets").insert({
        user_id: user.id,
        ticket_number: ticketNumber,
        status: "pending",
        proof_of_payment: filePath,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("That ticket was taken, please try again!");
        } else {
          toast.error("Failed to buy ticket");
        }
      } else {
        toast.success(`Ticket #${ticketNumber} reserved with proof of payment!`);
        setFile(null);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process ticket");
    }
    setBuying(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const remaining = TOTAL_TICKETS - soldCount;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-12">
        <div className="grid gap-6">
          <Card className="overflow-hidden">
            <img src={rabbitRaffle} alt="Raffle rabbit" className="h-56 w-full object-cover" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-6 w-6 text-accent" /> Lucky Rabbit Raffle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-muted p-4">
                  <div className="text-2xl font-bold text-foreground">R{TICKET_PRICE}</div>
                  <div className="text-sm text-muted-foreground">Per Ticket</div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="text-2xl font-bold text-primary">{remaining}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <div className="text-2xl font-bold text-accent">{TOTAL_TICKETS}</div>
                  <div className="text-sm text-muted-foreground">Total Tickets</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tickets Sold</span>
                  <span className="font-medium">{soldCount}/{TOTAL_TICKETS}</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${(soldCount / TOTAL_TICKETS) * 100}%` }} />
                </div>
              </div>

              {/* Payment details */}
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
                <h3 className="font-semibold">Payment Details (R{TICKET_PRICE})</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Account Holder: <strong>E Roos</strong></span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("E Roos")}><Copy className="h-3 w-3" /></Button>
                  </div>
                  <div><span>Bank: <strong>ABSA</strong></span></div>
                  <div className="flex items-center justify-between">
                    <span>Account: <strong>4787692448351010</strong></span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("4787692448351010")}><Copy className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Branch Code: <strong>632005</strong></span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("632005")}><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Reference: RAFFLE-{user?.email}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Proof of Payment
                </h3>
                <p className="text-sm text-muted-foreground">Upload a screenshot or PDF of your R50 payment.</p>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-sm text-primary flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {file.name}
                  </p>
                )}
              </div>

              <Button className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold" size="lg" onClick={buyTicket} disabled={buying || remaining <= 0 || !file}>
                {remaining <= 0 ? "Sold Out!" : buying ? "Uploading..." : "Buy Raffle Ticket - R50"}
              </Button>

              {/* My tickets */}
              {myTickets.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Your Tickets</h3>
                  <div className="flex flex-wrap gap-2">
                    {myTickets.map((t) => (
                      <div key={t.id} className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium">
                        #{t.ticket_number} <span className="text-xs text-muted-foreground">({t.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
