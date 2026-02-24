import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import InvestmentCard from "@/components/InvestmentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rabbit, Ticket, ShieldCheck, TrendingUp } from "lucide-react";
import heroRabbit from "@/assets/hero-rabbit.jpg";
import rabbitRaffle from "@/assets/rabbit-raffle.jpg";

const investments = [200, 500, 1000, 2000, 5000, 10000];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroRabbit} alt="Lucky investment rabbit on gold coins" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>
        <div className="container relative flex min-h-[70vh] items-center py-20">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-card/20 px-4 py-1.5 text-sm text-primary-foreground backdrop-blur-sm">
              <Rabbit className="h-4 w-4" /> Trusted Rabbit Investments
            </div>
            <h1 className="text-5xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Grow Your <span className="text-gradient-gold">Wealth</span> With BunnyVest
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Earn 2% daily returns over 180 days with our secure investment packages. Start from as little as R200 and watch your money multiply like bunnies!
            </p>
            <div className="flex gap-4">
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button size="lg" className="bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold">
                  Start Investing
                </Button>
              </Link>
              <a href="#packages">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  View Packages
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="border-b bg-card py-8">
        <div className="container grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Secure & Trusted", desc: "Your investments are protected" },
            { icon: TrendingUp, title: "2% Daily Returns", desc: "Earn 2% every day for 180 days" },
            { icon: Rabbit, title: "Growing Fast", desc: "Join hundreds of happy investors" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Investment packages */}
      <section id="packages" className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Investment Packages</h2>
            <p className="mt-3 text-muted-foreground">Choose your plan and start earning today</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {investments.map((amount, i) => (
              <InvestmentCard key={amount} amount={amount} returnRate={0.02} days={180} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Raffle */}
      <section className="bg-gradient-forest py-20">
        <div className="container grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-card/10 px-4 py-1.5 text-sm text-primary-foreground backdrop-blur-sm">
              <Ticket className="h-4 w-4" /> Lucky Rabbit Raffle
            </div>
            <h2 className="text-4xl font-bold text-primary-foreground">Win Big with Our Raffle!</h2>
            <p className="text-lg text-primary-foreground/80">
              Get your raffle ticket for just R50! Only 500 tickets available — the fewer tickets sold, the better your chances of winning the grand prize!
            </p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold text-gradient-gold">R50</div>
                <div className="text-sm text-primary-foreground/60">Per Ticket</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gradient-gold">500</div>
                <div className="text-sm text-primary-foreground/60">Total Tickets</div>
              </div>
            </div>
            <Link to={user ? "/raffle" : "/auth"}>
              <Button size="lg" className="bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold">
                Buy Raffle Ticket
              </Button>
            </Link>
          </div>
          <div className="flex justify-center">
            <img src={rabbitRaffle} alt="Lucky raffle rabbit" className="w-80 rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Payment info */}
      <section className="py-16">
        <div className="container max-w-2xl">
          <Card className="border-accent/20">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Payment Details</h3>
              <p className="text-muted-foreground">Make your investment payment via EFT to the following account:</p>
              <div className="rounded-lg bg-muted p-6 text-left space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Account Holder:</span><strong>E Roos</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bank:</span><strong>ABSA</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Account Number:</span><strong>4787692448351010</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Branch Code:</span><strong>632005</strong></div>
              </div>
              <p className="text-sm text-muted-foreground">Use your registered email as the payment reference</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Rabbit className="h-5 w-5 text-primary" />
            <span>© 2026 BunnyVest. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            <Link to="/auth" className="hover:text-foreground">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
