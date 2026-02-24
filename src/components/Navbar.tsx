import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Rabbit, LogOut, LayoutDashboard, Shield } from "lucide-react";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Rabbit className="h-8 w-8 text-primary animate-hop" />
          <span className="text-xl font-bold text-foreground">BunnyVest</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-gold text-accent-foreground hover:opacity-90">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
