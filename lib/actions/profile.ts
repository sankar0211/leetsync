"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name: string; avatarUrl: string }) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!data.name || data.name.trim().length === 0) {
    return { error: "Name is required" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl || null,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { error: "Failed to update profile" };
  }
}
