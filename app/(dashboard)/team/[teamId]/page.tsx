import { getCurrentUser } from "@/lib/actions/auth";
import { verifyTeamMembership } from "@/lib/actions/team";
import { getTodaysProblems } from "@/lib/actions/problems";
import { prisma } from "@/lib/prisma";
import { getTodaysSetter, getToday } from "@/lib/utils/rotation";
import { dailyScore, totalScore, aiUsagePercentage } from "@/lib/utils/scoring";
import { calculateStreaks } from "@/lib/utils/streaks";
import { redirect, notFound } from "next/navigation";
import { TodaysProblems } from "@/components/dashboard/todays-problems";
import { ProblemEntryForm } from "@/components/problems/problem-entry-form";
import { ProgressBoard } from "@/components/dashboard/progress-board";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { TeamStats } from "@/components/dashboard/team-stats";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChatBox } from "@/components/dashboard/chat-box";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const auth = await verifyTeamMembership(teamId);
  if (!auth) notFound();

  // Fetch team with all memberships
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { rotationPosition: "asc" },
      },
    },
  });
  if (!team) notFound();

  // Determine today's setter
  const members = team.memberships.map((m) => ({
    userId: m.userId,
    rotationPosition: m.rotationPosition,
  }));
  const todaysSetterId = getTodaysSetter(team.createdAt, members);
  const todaysSetter = team.memberships.find(
    (m) => m.userId === todaysSetterId
  );

  // Get today's problems
  const todaysProblems = await getTodaysProblems(teamId);

  // Determine if current user is today's setter
  const isCurrentUserSetter = todaysSetterId === user.id;

  // ── Leaderboard Data ──
  // Get all daily problems and completions for this team
  const allDailyProblems = await prisma.dailyProblem.findMany({
    where: { teamId },
    include: {
      completions: true,
    },
    orderBy: { date: "asc" },
  });

  // Calculate leaderboard data per member
  const leaderboardData = team.memberships.map((member) => {
    // Get all completions for this user in this team
    const userCompletions = allDailyProblems.flatMap((dp) =>
      dp.completions.filter((c) => c.userId === member.userId)
    );

    // Group by day for scoring
    const dayCompletions = allDailyProblems.map((dp) =>
      dp.completions.filter((c) => c.userId === member.userId)
    );

    const points = totalScore(dayCompletions);
    const completedCount = userCompletions.filter((c) => c.completed).length;
    const aiPct = aiUsagePercentage(userCompletions);

    // Streaks
    const dayScores = allDailyProblems.map((dp) => ({
      date: dp.date,
      score: dailyScore(
        dp.completions.filter((c) => c.userId === member.userId)
      ),
    }));
    const streaks = calculateStreaks(dayScores);

    // Last completion time EVER (time they finished their last problem across all days)
    const validCompletions = userCompletions.filter((c) => c.completedAt);
    const lastCompletionEver = validCompletions.length
      ? validCompletions.reduce((latest, c) => {
          if (!c.completedAt) return latest;
          if (!latest) return c.completedAt;
          return c.completedAt > latest ? c.completedAt : latest;
        }, null as Date | null)
      : null;

    return {
      userId: member.userId,
      name: member.user.name,
      username: member.user.username,
      points,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      completedCount,
      aiPercentage: aiPct,
      lastCompletionEver,
    };
  });

  // Sort leaderboard: points desc, then earliest completion time first for tiebreak
  leaderboardData.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    // Tiebreak: earliest time they finished any problem across all days
    if (a.lastCompletionEver && b.lastCompletionEver) {
      return (
        a.lastCompletionEver.getTime() - b.lastCompletionEver.getTime()
      );
    }
    if (a.lastCompletionEver) return -1;
    if (b.lastCompletionEver) return 1;
    return 0;
  });

  // ── Team Stats ──
  const today = getToday();
  const todayCompletionsCount = todaysProblems
    ? todaysProblems.completions.filter((c) => c.completed).length
    : 0;
  const todayTotalPossible = team.memberships.length * 2;
  const todayCompletionPct = todayTotalPossible
    ? Math.round((todayCompletionsCount / todayTotalPossible) * 100)
    : 0;

  const totalProblemsSolved = allDailyProblems.reduce(
    (sum, dp) => sum + dp.completions.filter((c) => c.completed).length,
    0
  );

  const totalDays = allDailyProblems.length;
  const totalPossibleCompletions = totalDays * team.memberships.length * 2;
  const avgDailyCompletionRate = totalPossibleCompletions
    ? Math.round(
        (allDailyProblems.reduce(
          (sum, dp) => sum + dp.completions.filter((c) => c.completed).length,
          0
        ) /
          totalPossibleCompletions) *
          100
      )
    : 0;

  // Team streak (consecutive days with at least one problem set)
  const teamDayScores = allDailyProblems.map((dp) => ({
    date: dp.date,
    score: dp.completions.some((c) => c.completed) ? 1 : 0,
  }));
  const teamStreaks = calculateStreaks(teamDayScores);

  // ── Activity Feed ──
  const recentActivity = await prisma.activityLog.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      {/* Team header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            Team Code:{" "}
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
              {team.uniqueCode}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/team/${teamId}/history`}>
            <Button variant="outline" size="sm">
              History
            </Button>
          </Link>
          {team.ownerId === user.id && (
            <Link href={`/team/${teamId}/admin`}>
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Today's problems or entry form */}
      {todaysProblems ? (
        <div className="space-y-6">
          <TodaysProblems
            teamId={teamId}
            problems={todaysProblems}
            currentUserId={user.id}
            setterName={todaysSetter?.user.name ?? "Unknown"}
          />
          <ChatBox teamId={teamId} currentUserId={user.id} />
        </div>
      ) : isCurrentUserSetter ? (
        <div className="space-y-6">
          <ProblemEntryForm teamId={teamId} />
          <ChatBox teamId={teamId} currentUserId={user.id} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-border/50 bg-card text-center">
            <p className="text-lg">
              ⏳ It&apos;s{" "}
              <span className="font-semibold text-emerald-400">
                {todaysSetter?.user.name ?? "someone"}
              </span>
              &apos;s turn to set today&apos;s problems
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon!
            </p>
          </div>
          <ChatBox teamId={teamId} currentUserId={user.id} />
        </div>
      )}

      {/* Dashboard grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress Board */}
        {todaysProblems && (
          <ProgressBoard
            problems={todaysProblems}
            members={team.memberships.map((m) => ({
              userId: m.userId,
              name: m.user.name,
              username: m.user.username,
            }))}
          />
        )}

        {/* Leaderboard */}
        <Leaderboard data={leaderboardData} teamId={teamId} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Stats */}
        <TeamStats
          teamStreak={teamStreaks.current}
          totalProblemsSolved={totalProblemsSolved}
          avgDailyCompletion={avgDailyCompletionRate}
          totalMembers={team.memberships.length}
          todayCompletion={todayCompletionPct}
        />

        {/* Activity Feed */}
        <ActivityFeed activities={recentActivity} />
      </div>
    </div>
  );
}
