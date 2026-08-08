"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompletionToggles } from "@/components/problems/completion-toggles";
import { motion } from "framer-motion";

interface TodaysProblemsProps {
  teamId: string;
  problems: {
    id: string;
    problem1Number: number;
    problem1Name: string;
    problem2Number: number;
    problem2Name: string;
    completions: {
      id: string;
      userId: string;
      problemNumber: number;
      completed: boolean;
      completedAt: Date | null;
      usedLeetAI: boolean;
    }[];
  };
  currentUserId: string;
  setterName: string;
}

export function TodaysProblems({
  teamId,
  problems,
  currentUserId,
  setterName,
}: TodaysProblemsProps) {
  const userCompletions = problems.completions.filter(
    (c) => c.userId === currentUserId
  );
  const p1Completion = userCompletions.find((c) => c.problemNumber === 1);
  const p2Completion = userCompletions.find((c) => c.problemNumber === 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Today&apos;s Problems</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Set by {setterName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Problem 1 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                P1
              </span>
              <div>
                <a
                  href={`https://leetcode.com/problems/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-emerald-400 transition-colors"
                >
                  #{problems.problem1Number} — {problems.problem1Name}
                </a>
              </div>
            </div>
            <CompletionToggles
              teamId={teamId}
              dailyProblemId={problems.id}
              problemNumber={1}
              initialCompleted={p1Completion?.completed ?? false}
              initialUsedAI={p1Completion?.usedLeetAI ?? false}
              isLocked={!!p1Completion?.completedAt}
            />
          </div>

          {/* Problem 2 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                P2
              </span>
              <div>
                <a
                  href={`https://leetcode.com/problems/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-emerald-400 transition-colors"
                >
                  #{problems.problem2Number} — {problems.problem2Name}
                </a>
              </div>
            </div>
            <CompletionToggles
              teamId={teamId}
              dailyProblemId={problems.id}
              problemNumber={2}
              initialCompleted={p2Completion?.completed ?? false}
              initialUsedAI={p2Completion?.usedLeetAI ?? false}
              isLocked={!!p2Completion?.completedAt}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
