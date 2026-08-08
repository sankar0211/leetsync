"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface TeamStatsProps {
  teamStreak: number;
  totalProblemsSolved: number;
  avgDailyCompletion: number;
  totalMembers: number;
  todayCompletion: number;
}

export function TeamStats({
  teamStreak,
  totalProblemsSolved,
  avgDailyCompletion,
  totalMembers,
  todayCompletion,
}: TeamStatsProps) {
  const stats = [
    { label: "Team Streak", value: `${teamStreak}d`, icon: "🔥" },
    { label: "Problems Solved", value: totalProblemsSolved, icon: "✅" },
    { label: "Avg Completion", value: `${avgDailyCompletion}%`, icon: "📈" },
    { label: "Members", value: totalMembers, icon: "👥" },
    { label: "Today", value: `${todayCompletion}%`, icon: "📅" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Team Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-lg bg-muted/30 text-center"
            >
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
