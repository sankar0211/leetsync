import { getCurrentUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { SecurityQuestionsForm } from "./security-questions-form";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plainPassword: true, securityQuestions: true },
  });

  const hasPlainPassword = !!dbUser?.plainPassword;
  const initialQuestions = (dbUser?.securityQuestions as { question: string, answer: string }[]) || [];

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <ProfileForm user={user} />
      <SecurityQuestionsForm hasPlainPassword={hasPlainPassword} initialQuestions={initialQuestions} />
    </div>
  );
}
