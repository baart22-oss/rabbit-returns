import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, Coins, ArrowRight } from "lucide-react";

import starterBunny from "@/assets/tier-starter-bunny.jpg";
import juniorHopper from "@/assets/tier-junior-hopper.jpg";
import silverRabbit from "@/assets/tier-silver-rabbit.jpg";
import goldRabbit from "@/assets/tier-gold-rabbit.jpg";
import platinumHare from "@/assets/tier-platinum-hare.jpg";
import diamondWarren from "@/assets/tier-diamond-warren.jpg";

const tierNames = ["Starter Bunny", "Junior Hopper", "Silver Rabbit", "Gold Rabbit", "Platinum Hare", "Diamond Warren"];
const tierImages = [starterBunny, juniorHopper, silverRabbit, goldRabbit, platinumHare, diamondWarren];

export default function InvestmentCard({ amount, returnRate, days, index }: any) {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden border-border/50 hover:shadow-gold transition-all cursor-pointer" 
          onClick={() => navigate(`/invest/${amount}`)}>
      <div className="relative h-44">
        <img src={tierImages[index]} alt={tierNames[index]} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">TIER {index + 1}</div>
      </div>
      <CardHeader>
        <CardTitle>{tierNames[index]}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gradient-gold mb-4">R{amount.toLocaleString()}</div>
        <div className="text-sm space-y-1 text-muted-foreground">
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {returnRate * 100}% Daily</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {days} Days</div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-gradient-forest">
          Invest Now <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
