import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, Coins } from "lucide-react";

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
  // 2% daily for 180 days
  const totalReturn = amount * (returnRate * days);
  const returnAmount = amount + totalReturn;

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
