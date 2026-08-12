"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompletionToggles } from "@/components/problems/completion-toggles";
import { motion } from "framer-motion";
import { extendDailyProblem } from "@/lib/actions/problems";
import { getProblemList } from "@/lib/utils/problems";
import { Clock, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface TodaysProblemsProps {
  teamId: string;
  problems: {
    id: string;
    problemsData: any;
    problem1Number: number | null;
    problem1Name: string | null;
    problem2Number: number | null;
    problem2Name: string | null;
    problemSetterId: string;
    extendedUntil: Date | null;
    date: Date;
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
  isAdmin: boolean;
}

export function TodaysProblems({
  teamId,
  problems,
  currentUserId,
  setterName,
  isAdmin,
}: TodaysProblemsProps) {
  const userCompletions = problems.completions.filter(
    (c) => c.userId === currentUserId
  );
  
  const problemList = getProblemList(problems);
  const isSetter = currentUserId === problems.problemSetterId;
  const canExtend = isAdmin || isSetter;

  const [isPending, startTransition] = useTransition();

  const handleExtend = () => {
    startTransition(async () => {
      const result = await extendDailyProblem(teamId, problems.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Problem duration extended by 24 hours!");
      }
    });
  };

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isToday = formatDate(problems.date) === formatDate(new Date());
  // Show extended badge if it's currently extended beyond now
  const isExtendedDisplay = problems.extendedUntil && problems.extendedUntil > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-border/50 ${isExtendedDisplay ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {isToday ? "Today's Problems" : `Extended Problems (${formatDate(problems.date)})`}
              </CardTitle>
              {isExtendedDisplay && (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                  <Clock className="w-3 h-3 mr-1" /> Extended
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Set by {setterName}
              </Badge>
              {canExtend && (
                <Button variant="outline" size="sm" onClick={handleExtend} disabled={isPending} className="text-xs h-6 px-2">
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Extend +1 Day
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {problemList.map((prob, index) => {
            const completion = userCompletions.find((c) => c.problemNumber === index + 1);
            const slug = prob.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    P{index + 1}
                  </span>
                  <div>
                    <a
                      href={`https://leetcode.com/problems/${slug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-emerald-400 transition-colors"
                    >
                      #{prob.number} — {prob.name}
                    </a>
                  </div>
                </div>
                <CompletionToggles
                  teamId={teamId}
                  dailyProblemId={problems.id}
                  problemNumber={index + 1}
                  problemSlug={slug}
                  initialCompleted={completion?.completed ?? false}
                  initialUsedAI={completion?.usedLeetAI ?? false}
                  isLocked={!!completion?.completedAt}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
