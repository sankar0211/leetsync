"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import Link from "next/link";

interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  points: number;
  currentStreak: number;
  completedCount: number;
  aiPercentage: number;
  lastCompletionEver: Date | null;
}

interface LeaderboardProps {
  data: LeaderboardEntry[];
  teamId: string;
}

export function Leaderboard({ data, teamId }: LeaderboardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🏆 Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((entry, index) => {
            const isTop = index === 0 && entry.points > 0;
            const initials = entry.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/team/${teamId}/member/${entry.userId}`}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-muted/50 cursor-pointer ${
                      isTop
                        ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                        : "bg-muted/30"
                    }`}
                  >
                    {/* Rank */}
                    <span
                      className={`text-lg font-bold w-8 text-center ${
                        isTop ? "text-emerald-400" : "text-muted-foreground"
                      }`}
                    >
                      {index === 0
                        ? "👑"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `#${index + 1}`}
                    </span>

                    {/* Avatar */}
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={`text-xs font-semibold ${
                          isTop
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {entry.name}
                        </span>
                        {isTop && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5">
                            TOP
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>🔥 {entry.currentStreak}d</span>
                        <span>✅ {entry.completedCount}</span>
                        {entry.aiPercentage > 0 && (
                          <span>🤖 {entry.aiPercentage}%</span>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${
                          isTop ? "text-emerald-400" : "text-foreground"
                        }`}
                      >
                        {entry.points}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        pts
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {data.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No data yet. Complete some problems to appear here!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
