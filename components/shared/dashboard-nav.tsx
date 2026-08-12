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
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

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
  const { setTheme, theme } = useTheme();

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
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="font-semibold">Teams</Button>}
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  My Teams
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/create-team" />}>
                  Create Team
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/join-team" />}>
                  Join Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="flex items-center justify-between cursor-pointer">
                  <span>Toggle Theme</span>
                  <div className="flex items-center">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/profile" />}>
                  Profile Settings
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

          {/* Mobile Navigation */}
          <div className="md:hidden">
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
                <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="flex items-center justify-between cursor-pointer">
                  <span>Toggle Theme</span>
                  <div className="flex items-center">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                </DropdownMenuItem>
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
      </div>
    </header>
  );
}
