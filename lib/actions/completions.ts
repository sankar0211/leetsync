"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// Toggle Problem Completion
//
// CRITICAL: completedAt is WRITE-ONCE.
// Once set, it must never be overwritten.
// After first completion, only usedLeetAI can change.
// completed cannot be toggled back to false once completedAt is set.
// ──────────────────────────────────────────────

export async function toggleCompletion(
  teamId: string,
  dailyProblemId: string,
  problemNumber: number,
  completed: boolean,
  usedLeetAI: boolean
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Verify membership
  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!membership) return { error: "Not a team member" };

  // Validate problemNumber
  if (problemNumber !== 1 && problemNumber !== 2) {
    return { error: "Invalid problem number" };
  }

  const dp = await prisma.dailyProblem.findUnique({
    where: { id: dailyProblemId },
    select: { date: true }
  });
  if (!dp) return { error: "Daily problem not found" };
  const dateStr = dp.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Fetch existing record
  const existing = await prisma.completionRecord.findUnique({
    where: {
      dailyProblemId_userId_problemNumber: {
        dailyProblemId,
        userId: user.id,
        problemNumber,
      },
    },
  });

  // ── Guard: completedAt is immutable once set ──
  if (existing?.completedAt) {
    // Record was already completed. Only allow usedLeetAI changes.
    if (!completed) {
      return { error: "Cannot un-complete a problem after completion timestamp is set" };
    }

    // Only update usedLeetAI if it changed
    if (existing.usedLeetAI !== usedLeetAI) {
      await prisma.completionRecord.update({
        where: { id: existing.id },
        data: { usedLeetAI },
      });

      // Log AI usage toggle
      if (usedLeetAI) {
        await prisma.activityLog.create({
          data: {
            teamId,
            userId: user.id,
            type: "AI_USED",
            message: `${user.name} used Leet AI on Problem ${problemNumber}`,
          },
        });
      }
    }

    revalidatePath(`/team/${teamId}`);
    return { error: null };
  }

  // ── New completion or first-time marking ──
  if (completed) {
    // Upsert the record with completedAt = now (first write)
    await prisma.completionRecord.upsert({
      where: {
        dailyProblemId_userId_problemNumber: {
          dailyProblemId,
          userId: user.id,
          problemNumber,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
        usedLeetAI,
      },
      create: {
        dailyProblemId,
        userId: user.id,
        problemNumber,
        completed: true,
        completedAt: new Date(),
        usedLeetAI,
      },
    });

    // Log completion
    await prisma.activityLog.create({
      data: {
        teamId,
        userId: user.id,
        type: "PROBLEM_COMPLETED",
        message: `${user.name} completed Problem ${problemNumber} for ${dateStr}`,
      },
    });

    // Check if both problems are now completed
    const otherProblemNumber = problemNumber === 1 ? 2 : 1;
    const otherCompletion = await prisma.completionRecord.findUnique({
      where: {
        dailyProblemId_userId_problemNumber: {
          dailyProblemId,
          userId: user.id,
          problemNumber: otherProblemNumber,
        },
      },
    });

    if (otherCompletion?.completed) {
      await prisma.activityLog.create({
        data: {
          teamId,
          userId: user.id,
          type: "BOTH_COMPLETED",
          message: `${user.name} completed both problems for ${dateStr}!`,
        },
      });
    }

    // Log AI usage if applicable
    if (usedLeetAI) {
      await prisma.activityLog.create({
        data: {
          teamId,
          userId: user.id,
          type: "AI_USED",
          message: `${user.name} used Leet AI on Problem ${problemNumber}`,
        },
      });
    }
  } else {
    // Not completing — just creating/updating the record without completedAt
    await prisma.completionRecord.upsert({
      where: {
        dailyProblemId_userId_problemNumber: {
          dailyProblemId,
          userId: user.id,
          problemNumber,
        },
      },
      update: {
        completed: false,
        usedLeetAI,
      },
      create: {
        dailyProblemId,
        userId: user.id,
        problemNumber,
        completed: false,
        usedLeetAI,
      },
    });
  }

  revalidatePath(`/team/${teamId}`);
  return { error: null };
}
