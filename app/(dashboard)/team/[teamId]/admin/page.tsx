import { getCurrentUser } from "@/lib/actions/auth";
import { verifyTeamMembership } from "@/lib/actions/team";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const auth = await verifyTeamMembership(teamId);
  if (!auth) notFound();

  // Verify owner
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

  if (!team || team.ownerId !== user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Admin</h1>
          <p className="text-sm text-muted-foreground">{team.name}</p>
        </div>
        <Link href={`/team/${teamId}`}>
          <Button variant="ghost" size="sm">
            ← Back to team
          </Button>
        </Link>
      </div>

      <AdminPanel
        teamId={team.id}
        teamName={team.name}
        ownerId={team.ownerId}
        members={team.memberships.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          username: m.user.username,
          rotationPosition: m.rotationPosition,
        }))}
      />
    </div>
  );
}
