"use client";

import { useActionState } from "react";
import { createTeam } from "@/lib/actions/team";
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

export default function CreateTeamPage() {
  const [state, formAction, isPending] = useActionState(createTeam, {
    error: null as string | null,
    teamId: null as string | null,
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
            <CardTitle>Create a Team</CardTitle>
            <CardDescription>
              Set up a new team for your LeetCode accountability group. Share
              the team code and password with your friends so they can join.
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
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., LeetCode Warriors"
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Team Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Friends will need this to join"
                  required
                  minLength={4}
                />
                <p className="text-xs text-muted-foreground">
                  At least 4 characters. Share this with people you want to
                  invite.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  "Create Team"
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
