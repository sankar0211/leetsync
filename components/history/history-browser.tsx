"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { dailyScore } from "@/lib/utils/scoring";

interface DailyProblem {
  id: string;
  date: string;
  problemsData?: { number: number; name: string }[] | null;
  problem1Number: number | null;
  problem1Name: string | null;
  problem2Number: number | null;
  problem2Name: string | null;
  problemSetter: { id: string; name: string; username: string };
  completions: {
    userId: string;
    problemNumber: number;
    completed: boolean;
    completedAt: string | null;
    usedLeetAI: boolean;
    user: { id: string; name: string; username: string };
  }[];
}

interface HistoryBrowserProps {
  dailyProblems: DailyProblem[];
  members: { userId: string; name: string; username: string }[];
}

export function HistoryBrowser({
  dailyProblems,
  members,
}: HistoryBrowserProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dailyProblems.length > 0 ? dailyProblems[0].date : null
  );

  const selectedProblem = dailyProblems.find(
    (dp) => dp.date === selectedDate
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Date list */}
      <Card className="border-border/50 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Past Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {dailyProblems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No history yet
              </p>
            ) : (
              dailyProblems.map((dp) => {
                const dateStr = new Date(dp.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const isSelected = dp.date === selectedDate;

                return (
                  <Button
                    key={dp.id}
                    variant={isSelected ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                    onClick={() => setSelectedDate(dp.date)}
                  >
                    <span>{dateStr}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {dp.completions.filter((c) => c.completed).length}/
                      {members.length * 2}
                    </Badge>
                  </Button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Day detail */}
      <div className="lg:col-span-2 space-y-4">
        <AnimatePresence mode="wait">
          {selectedProblem ? (
            <motion.div
              key={selectedProblem.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Problems */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {new Date(selectedProblem.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </CardTitle>
                    <Badge variant="secondary">
                      Set by {selectedProblem.problemSetter.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    let p1Number = selectedProblem.problem1Number;
                    let p1Name = selectedProblem.problem1Name;
                    let p2Number = selectedProblem.problem2Number;
                    let p2Name = selectedProblem.problem2Name;
                    
                    if (selectedProblem.problemsData && Array.isArray(selectedProblem.problemsData)) {
                      if (selectedProblem.problemsData.length > 0) {
                        p1Number = selectedProblem.problemsData[0].number;
                        p1Name = selectedProblem.problemsData[0].name;
                      }
                      if (selectedProblem.problemsData.length > 1) {
                        p2Number = selectedProblem.problemsData[1].number;
                        p2Name = selectedProblem.problemsData[1].name;
                      }
                    }

                    return (
                      <>
                        {p1Name && p1Number && (
                          <div className="p-3 rounded-lg bg-muted/30">
                            <span className="text-xs text-muted-foreground">P1: </span>
                            <a
                              href={`https://leetcode.com/problems/${p1Name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-emerald-400 transition-colors"
                            >
                              #{p1Number} — {p1Name}
                            </a>
                          </div>
                        )}
                        {p2Name && p2Number && (
                          <div className="p-3 rounded-lg bg-muted/30">
                            <span className="text-xs text-muted-foreground">P2: </span>
                            <a
                              href={`https://leetcode.com/problems/${p2Name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-emerald-400 transition-colors"
                            >
                              #{p2Number} — {p2Name}
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Completion table */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Completions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {members.map((member) => {
                      const memberCompletions =
                        selectedProblem.completions.filter(
                          (c) => c.userId === member.userId
                        );
                      const p1 = memberCompletions.find(
                        (c) => c.problemNumber === 1
                      );
                      const p2 = memberCompletions.find(
                        (c) => c.problemNumber === 2
                      );
                      const score = dailyScore(memberCompletions);

                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <span className="font-medium text-sm">
                            {member.name}
                          </span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                P1
                              </span>
                              <span>
                                {p1?.completed ? "✅" : "⬜"}
                              </span>
                              {p1?.usedLeetAI && <span className="text-xs">🤖</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                P2
                              </span>
                              <span>
                                {p2?.completed ? "✅" : "⬜"}
                              </span>
                              {p2?.usedLeetAI && <span className="text-xs">🤖</span>}
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-xs font-mono"
                            >
                              {score}pts
                            </Badge>
                            {p1?.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(p1.completedAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a date to view its details
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
