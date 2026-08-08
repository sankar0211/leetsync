"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";

export async function getMessages(teamId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });

  if (!membership) return { error: "Not a team member" };

  const messages = await prisma.message.findMany({
    where: { teamId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, name: true, username: true },
      },
    },
    take: 100, // Limit to last 100 messages for performance
  });

  return { messages };
}

export async function sendMessage(teamId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!content || content.trim().length === 0) {
    return { error: "Message cannot be empty" };
  }

  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });

  if (!membership) return { error: "Not a team member" };

  const message = await prisma.message.create({
    data: {
      teamId,
      userId: user.id,
      content: content.trim(),
    },
    include: {
      user: {
        select: { id: true, name: true, username: true },
      },
    },
  });

  return { message };
}
