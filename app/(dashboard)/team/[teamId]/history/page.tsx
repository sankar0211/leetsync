import { getCurrentUser } from "@/lib/actions/auth";
import { verifyTeamMembership } from "@/lib/actions/team";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { HistoryBrowser } from "@/components/history/history-browser";

interface HistoryPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const auth = await verifyTeamMembership(teamId);
  if (!auth) notFound();

  // Get team info
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, ownerId: true },
  });
  if (!team) notFound();

  // Get all dates that have problems set
  const dailyProblems = await prisma.dailyProblem.findMany({
    where: { teamId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      extendedUntil: true,
      personalExtensions: true,
      problemsData: true,
      problem1Number: true,
      problem1Name: true,
      problem2Number: true,
      problem2Name: true,
      problemSetter: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });

  // Get team members for the completion table
  const members = await prisma.teamMembership.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { rotationPosition: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">{team.name}</p>
      </div>

      <HistoryBrowser
        teamId={teamId}
        isAdmin={team.ownerId === user.id}
        currentUserId={user.id}
        dailyProblems={JSON.parse(JSON.stringify(dailyProblems))}
        members={members.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          username: m.user.username,
        }))}
      />
    </div>
  );
}
