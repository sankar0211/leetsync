import { getCurrentUser } from "@/lib/actions/auth";
import { getUserTeams } from "@/lib/actions/team";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const teams = await getUserTeams();

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {user.name}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay consistent, stay accountable.
        </p>
      </div>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create a team or join one with a team code to start tracking your
              LeetCode progress with friends.
            </p>
            <div className="flex gap-3">
              <Link href="/create-team">
                <Button>Create a Team</Button>
              </Link>
              <Link href="/join-team">
                <Button variant="outline">Join a Team</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/team/${team.id}`}>
              <Card className="hover:border-emerald-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors">
                      {team.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {team.memberCount}{" "}
                      {team.memberCount === 1 ? "member" : "members"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                      {team.uniqueCode}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
