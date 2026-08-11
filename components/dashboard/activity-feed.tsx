"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  } | null;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeIcons: Record<string, string> = {
  PROBLEM_COMPLETED: "✅",
  BOTH_COMPLETED: "🎉",
  AI_USED: "🤖",
  BECAME_SETTER: "🎯",
  JOINED_TEAM: "👋",
  LEFT_TEAM: "👋",
  TEAM_CREATED: "🚀",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📝 Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 mt-0.5 relative">
                {activity.user ? (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.avatarUrl || ""} alt={activity.user.name} />
                    <AvatarFallback className="text-[10px] bg-emerald-500/20 text-emerald-400">
                      {activity.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[10px]">📌</span>
                  </div>
                )}
                <span className="text-sm absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm leading-none text-[10px]">
                  {typeIcons[activity.type] ?? "📌"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(new Date(activity.createdAt))}
                </p>
              </div>
            </motion.div>
          ))}

          {activities.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No activity yet. Start by setting today&apos;s problems!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
