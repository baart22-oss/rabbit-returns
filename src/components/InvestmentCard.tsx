import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, Coins } from "lucide-react";

interface InvestmentCardProps {
  amount: number;
  returnRate: number;
  days: number;
  index: number;
}

const tierNames = ["Starter Bunny", "Junior Hopper", "Silver Rabbit", "Gold Rabbit", "Platinum Hare", "Diamond Warren"];

export default function InvestmentCard({ amount, returnRate, days, index }: InvestmentCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const returnAmount = amount * (1 + returnRate);

  return (
    <Card
      className="group relative overflow-hidden border-border/50 transition-all duration-300 hover:shadow-gold hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
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
            <span>{(returnRate * 100).toFixed(0)}% return</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{days} days maturity</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent" />
            <span>Returns: <strong className="text-foreground">R{returnAmount.toLocaleString()}</strong></span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gradient-forest text-primary-foreground hover:opacity-90"
          onClick={() => navigate(user ? `/invest/${amount}` : "/auth")}
        >
          Invest Now
        </Button>
      </CardFooter>
    </Card>
  );
}
