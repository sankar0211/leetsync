"use client";

import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface DashboardNavProps {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
        <Link
          href="/dashboard"
          className="hover:opacity-80 transition-opacity flex items-center -ml-2"
        >
          <img src="/logo-light.png" alt="LeetSync" className="h-16 w-auto block dark:hidden object-contain scale-[1.1] origin-left" />
          <img src="/logo-dark.png" alt="LeetSync" className="h-16 w-auto hidden dark:block object-contain scale-[1.1] origin-left" />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    @{user.username}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/profile" />}>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard" />}>
                My Teams
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/create-team" />}>
                Create Team
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/join-team" />}>
                Join Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  await signOut();
                }}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
