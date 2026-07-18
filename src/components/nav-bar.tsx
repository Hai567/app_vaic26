"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useChatStore } from "@/store/chat-store";
import { Compass, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/chat", label: "Tư vấn" },
  { href: "/roadmap", label: "Roadmap" },
];

export function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const setShowSettings = useChatStore((s) => s.setShowSettings);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            daFalcon
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-2 border-l border-border pl-2 flex items-center gap-1">
            <ThemeToggle />

            {user && (
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Cài đặt hồ sơ"
              >
                <Settings size={16} />
              </button>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="text-xs font-semibold ml-1">
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
