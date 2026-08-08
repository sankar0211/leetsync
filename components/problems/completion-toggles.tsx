"use client";

import { useState, useTransition } from "react";
import { toggleCompletion } from "@/lib/actions/completions";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

interface CompletionTogglesProps {
  teamId: string;
  dailyProblemId: string;
  problemNumber: number;
  initialCompleted: boolean;
  initialUsedAI: boolean;
  isLocked: boolean; // completedAt is already set
}

export function CompletionToggles({
  teamId,
  dailyProblemId,
  problemNumber,
  initialCompleted,
  initialUsedAI,
  isLocked,
}: CompletionTogglesProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [usedAI, setUsedAI] = useState(initialUsedAI);
  const [isPending, startTransition] = useTransition();

  const handleCompletionToggle = (checked: boolean) => {
    // Once locked (completedAt set), cannot un-complete
    if (isLocked && !checked) return;

    setCompleted(checked);
    startTransition(async () => {
      const result = await toggleCompletion(
        teamId,
        dailyProblemId,
        problemNumber,
        checked,
        usedAI
      );
      if (result.error) {
        // Revert on error
        setCompleted(!checked);
      }
    });
  };

  const handleAIToggle = (checked: boolean) => {
    setUsedAI(checked);
    startTransition(async () => {
      const result = await toggleCompletion(
        teamId,
        dailyProblemId,
        problemNumber,
        completed,
        checked
      );
      if (result.error) {
        setUsedAI(!checked);
      }
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch
          checked={completed}
          onCheckedChange={handleCompletionToggle}
          disabled={isPending}
          className="data-[state=checked]:bg-emerald-500"
        />
        <motion.span
          key={completed ? "done" : "todo"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-xs font-medium ${
            completed ? "text-emerald-400" : "text-muted-foreground"
          }`}
        >
          {completed ? "✓ Done" : "Mark done"}
        </motion.span>
      </div>

      {completed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Switch
            checked={usedAI}
            onCheckedChange={handleAIToggle}
            disabled={isPending}
            className="data-[state=checked]:bg-amber-500 scale-75"
          />
          <span
            className={`text-xs ${
              usedAI ? "text-amber-400" : "text-muted-foreground"
            }`}
          >
            {usedAI ? "🤖 AI" : "AI?"}
          </span>
        </motion.div>
      )}
    </div>
  );
}
