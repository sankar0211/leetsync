import { getCurrentUser } from "@/lib/actions/auth";
import { verifyTeamMembership } from "@/lib/actions/team";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { dailyScore, totalScore, aiUsagePercentage } from "@/lib/utils/scoring";
import { calculateStreaks } from "@/lib/utils/streaks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileHeatmap } from "@/components/profile/profile-heatmap";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MemberPageProps {
  params: Promise<{ teamId: string; userId: string }>;
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { teamId, userId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const auth = await verifyTeamMembership(teamId);
  if (!auth) notFound();

  // Get member info
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, email: true, createdAt: true, avatarUrl: true },
  });
  if (!member) notFound();

  // Get team info
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true },
  });
  if (!team) notFound();

  // Get all daily problems and this member's completions
  const allDailyProblems = await prisma.dailyProblem.findMany({
    where: { teamId },
    include: {
      completions: {
        where: { userId },
      },
    },
    orderBy: { date: "asc" },
  });

  // All completions flat
  const allCompletions = allDailyProblems.flatMap((dp) => dp.completions);

  // Scoring
  const dayCompletions = allDailyProblems.map((dp) => dp.completions);
  const points = totalScore(dayCompletions);
  const completedCount = allCompletions.filter((c) => c.completed).length;
  const aiPct = aiUsagePercentage(allCompletions);
  const aiCount = allCompletions.filter((c) => c.completed && c.usedLeetAI).length;

  // Streaks
  const dayScores = allDailyProblems.map((dp) => ({
    date: dp.date,
    score: dailyScore(dp.completions),
  }));
  const streaks = calculateStreaks(dayScores);

  // Days participated (days where at least one problem completed)
  const daysParticipated = dayScores.filter((d) => d.score > 0).length;

  // Average completion time
  const completionTimes = allCompletions
    .filter((c) => c.completed && c.completedAt)
    .map((c) => {
      const completedAt = new Date(c.completedAt!);
      return completedAt.getHours() * 60 + completedAt.getMinutes();
    });
  const avgCompletionTime =
    completionTimes.length > 0
      ? Math.round(
          completionTimes.reduce((sum, t) => sum + t, 0) /
            completionTimes.length
        )
      : null;
  const avgTimeFormatted = avgCompletionTime
    ? `${Math.floor(avgCompletionTime / 60)}:${String(
        avgCompletionTime % 60
      ).padStart(2, "0")}`
    : "N/A";

  // Heatmap data: map each day to a level 0-4
  const heatmapData = allDailyProblems.map((dp) => {
    const score = dailyScore(dp.completions);
    let level = 0;
    if (score === 10) level = 4;
    else if (score === 5) level = 2;
    return {
      date: new Date(dp.date).toISOString().split("T")[0],
      count: score,
      level: level as 0 | 1 | 2 | 3 | 4,
    };
  });

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href={`/team/${teamId}`}>
        <Button variant="ghost" size="sm">
          ← Back to {team.name}
        </Button>
      </Link>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={member.avatarUrl || ""} alt={member.name} />
          <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{member.name}</h1>
          <p className="text-sm text-muted-foreground">@{member.username}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Points", value: points, icon: "🏆" },
          { label: "Current Streak", value: `${streaks.current}d`, icon: "🔥" },
          { label: "Longest Streak", value: `${streaks.longest}d`, icon: "⚡" },
          { label: "Problems Solved", value: completedCount, icon: "✅" },
          { label: "Days Active", value: daysParticipated, icon: "📅" },
          { label: "AI Used", value: aiCount, icon: "🤖" },
          { label: "AI %", value: `${aiPct}%`, icon: "📊" },
          { label: "Avg Time", value: avgTimeFormatted, icon: "⏰" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Heatmap */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Activity Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileHeatmap data={heatmapData} />
        </CardContent>
      </Card>
    </div>
  );
}
