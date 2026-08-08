"use client";

import { useActionState } from "react";
import { joinTeam } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";

export default function JoinTeamPage() {
  const [state, formAction, isPending] = useActionState(joinTeam, {
    error: null as string | null,
  });

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Join a Team</CardTitle>
            <CardDescription>
              Enter the team code and password shared by your group to join
              their LeetCode accountability team.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {state.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {state.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">Team Code</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="e.g., ABC123"
                  required
                  className="font-mono uppercase tracking-wider"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Team Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="The team's password"
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Joining...
                  </span>
                ) : (
                  "Join Team"
                )}
              </Button>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to dashboard
              </Link>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
