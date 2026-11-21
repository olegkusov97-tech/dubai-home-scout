import { Link } from "@tanstack/react-router";
import { Building2, MessageSquareText } from "lucide-react";

export function AppNav() {
  const cls = "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-2xl font-semibold">
          Dubai<span className="text-gold">Nest</span>
        </Link>
        <nav className="flex gap-1">
          <Link to="/" className={cls} activeProps={{ className: "bg-secondary text-foreground" }} activeOptions={{ exact: true }}>
            <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Explore</span>
          </Link>
          <Link to="/chat" className={cls} activeProps={{ className: "bg-secondary text-foreground" }}>
            <MessageSquareText className="h-4 w-4" /> <span className="hidden sm:inline">AI Finder</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
