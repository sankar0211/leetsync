import { getCurrentUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <ProfileForm user={user} />;
}
