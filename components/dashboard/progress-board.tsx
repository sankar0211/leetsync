"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ProgressBoardProps {
  problems: {
    completions: {
      userId: string;
      problemNumber: number;
      completed: boolean;
      completedAt: Date | null;
      usedLeetAI: boolean;
    }[];
  };
  members: {
    userId: string;
    name: string;
    username: string;
  }[];
}

export function ProgressBoard({ problems, members }: ProgressBoardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Progress Board
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {members.map((member, index) => {
            const memberCompletions = problems.completions.filter(
              (c) => c.userId === member.userId
            );
            const p1 = memberCompletions.find((c) => c.problemNumber === 1);
            const p2 = memberCompletions.find((c) => c.problemNumber === 2);
            const completedCount = [p1, p2].filter(
              (c) => c?.completed
            ).length;

            const statusColor =
              completedCount === 2
                ? "text-emerald-400"
                : completedCount === 1
                ? "text-amber-400"
                : "text-red-400";

            return (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <span className="font-medium text-sm truncate flex-1">
                  {member.name}
                </span>

                <div className="flex items-center gap-3">
                  {/* P1 status */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">P1</span>
                    <span className="text-sm">
                      {p1?.completed ? "✅" : "⬜"}
                    </span>
                    {p1?.usedLeetAI && (
                      <span className="text-xs">🤖</span>
                    )}
                  </div>

                  {/* P2 status */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">P2</span>
                    <span className="text-sm">
                      {p2?.completed ? "✅" : "⬜"}
                    </span>
                    {p2?.usedLeetAI && (
                      <span className="text-xs">🤖</span>
                    )}
                  </div>

                  {/* Total */}
                  <Badge
                    variant="secondary"
                    className={`text-xs font-mono ${statusColor}`}
                  >
                    {completedCount}/2
                  </Badge>

                  {/* Completion time */}
                  {(p1?.completedAt || p2?.completedAt) && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(
                        p1?.completedAt && p2?.completedAt
                          ? new Date(
                              Math.min(
                                new Date(p1.completedAt).getTime(),
                                new Date(p2.completedAt).getTime()
                              )
                            )
                          : p1?.completedAt
                          ? new Date(p1.completedAt)
                          : p2?.completedAt
                          ? new Date(p2.completedAt)
                          : null
                      )}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
