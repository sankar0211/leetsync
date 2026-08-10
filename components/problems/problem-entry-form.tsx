"use client";

import { useActionState, useState } from "react";
import { submitDailyProblems } from "@/lib/actions/problems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface ProblemEntryFormProps {
  teamId: string;
}

export function ProblemEntryForm({ teamId }: ProblemEntryFormProps) {
  const submitAction = submitDailyProblems.bind(null, teamId);
  const [state, formAction, isPending] = useActionState(submitAction, {
    error: null as string | null,
  });

  const [problems, setProblems] = useState([
    { number: "", name: "" },
    { number: "", name: "" },
  ]);

  const updateProblem = (index: number, field: "number" | "name", value: string) => {
    const newProblems = [...problems];
    newProblems[index][field] = value;
    setProblems(newProblems);
  };

  const addProblem = () => {
    setProblems([...problems, { number: "", name: "" }]);
  };

  const removeProblem = (index: number) => {
    if (problems.length <= 1) return;
    const newProblems = [...problems];
    newProblems.splice(index, 1);
    setProblems(newProblems);
  };

  // Convert to correct format for submission
  const problemsDataStr = JSON.stringify(
    problems.map(p => ({
      number: parseInt(p.number, 10),
      name: p.name
    }))
  );

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
          <input type="hidden" name="problemsData" value={problemsDataStr} />
          <CardContent className="space-y-6">
            {state.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {state.error}
              </div>
            )}

            <div className="space-y-6">
              {problems.map((prob, index) => (
                <div key={index} className="space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Problem {index + 1}
                    </h3>
                    {problems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProblem(index)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Number</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1"
                        required
                        min={1}
                        value={prob.number}
                        onChange={(e) => updateProblem(index, "number", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        placeholder="e.g., Two Sum"
                        required
                        value={prob.name}
                        onChange={(e) => updateProblem(index, "name", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProblem}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add another problem
            </Button>

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
