"use client";

import { useState, useTransition } from "react";
import { toggleCompletion } from "@/lib/actions/completions";
import { verifyLeetCodeProblem } from "@/lib/actions/leetcode";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CompletionTogglesProps {
  teamId: string;
  dailyProblemId: string;
  problemNumber: number;
  problemSlug: string;
  initialCompleted: boolean;
  initialUsedAI: boolean;
  isLocked: boolean; // completedAt is already set
}

export function CompletionToggles({
  teamId,
  dailyProblemId,
  problemNumber,
  problemSlug,
  initialCompleted,
  initialUsedAI,
  isLocked,
}: CompletionTogglesProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [usedAI, setUsedAI] = useState(initialUsedAI);
  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (isLocked || isVerifying) return;

    setIsVerifying(true);
    try {
      const result = await verifyLeetCodeProblem(teamId, dailyProblemId, problemNumber, problemSlug);
      
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        setCompleted(true);
        toast.success("Problem successfully verified on LeetCode!");
      }
    } finally {
      setIsVerifying(false);
    }
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
        {completed ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center"
          >
            ✓ Verified
          </motion.span>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs px-3"
            onClick={handleVerify}
            disabled={isVerifying || isLocked}
          >
            {isVerifying ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <ExternalLink className="h-3 w-3 mr-1" />
            )}
            Verify on LeetCode
          </Button>
        )}
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
