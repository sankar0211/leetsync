"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";

import { MessageType } from "@/app/generated/prisma/client";

export async function getMessages(teamId: string, type?: MessageType) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });

  if (!membership) return { error: "Not a team member" };

  const messages = await prisma.message.findMany({
    where: type ? { teamId, type } : { teamId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      replyTo: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
    take: 100, // Limit to last 100 messages for performance
  });

  return { messages };
}

export async function sendMessage(teamId: string, content: string, replyToId?: string, type: MessageType = "GENERAL", metadata?: any) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!content || content.trim().length === 0) {
    return { error: "Message cannot be empty" };
  }

  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });

  if (!membership) return { error: "Not a team member" };

  // If a replyToId is provided, verify the message exists in this team
  if (replyToId) {
    const parentMsg = await prisma.message.findUnique({
      where: { id: replyToId },
    });
    if (!parentMsg || parentMsg.teamId !== teamId) {
      return { error: "Invalid reply reference" };
    }
  }

  const message = await prisma.message.create({
    data: {
      teamId,
      userId: user.id,
      content: content.trim(),
      type,
      metadata: metadata ? metadata : undefined,
      replyToId: replyToId || null,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      replyTo: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return { message };
}
