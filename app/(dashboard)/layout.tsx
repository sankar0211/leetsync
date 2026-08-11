import { getCurrentUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/shared/dashboard-nav";
import { LeetAIButton } from "@/components/shared/leet-ai-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={user} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
      <LeetAIButton />
    </div>
  );
}
