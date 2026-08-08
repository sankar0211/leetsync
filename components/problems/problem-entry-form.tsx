"use client";

import { useActionState } from "react";
import { submitDailyProblems } from "@/lib/actions/problems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ProblemEntryFormProps {
  teamId: string;
}

export function ProblemEntryForm({ teamId }: ProblemEntryFormProps) {
  const submitAction = submitDailyProblems.bind(null, teamId);
  const [state, formAction, isPending] = useActionState(submitAction, {
    error: null as string | null,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎯</span>
            <span>You&apos;re today&apos;s Problem Setter!</span>
          </CardTitle>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            {state.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {state.error}
              </div>
            )}

            {/* Problem 1 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Problem 1
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="problem1Number" className="text-xs">
                    Number
                  </Label>
                  <Input
                    id="problem1Number"
                    name="problem1Number"
                    type="number"
                    placeholder="e.g., 1"
                    required
                    min={1}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="problem1Name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="problem1Name"
                    name="problem1Name"
                    placeholder="e.g., Two Sum"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Problem 2 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Problem 2
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="problem2Number" className="text-xs">
                    Number
                  </Label>
                  <Input
                    id="problem2Number"
                    name="problem2Number"
                    type="number"
                    placeholder="e.g., 15"
                    required
                    min={1}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="problem2Name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="problem2Name"
                    name="problem2Name"
                    placeholder="e.g., 3Sum"
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Setting problems...
                </span>
              ) : (
                "Set Today's Problems"
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </motion.div>
  );
}
