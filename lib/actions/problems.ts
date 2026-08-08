"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { getToday, getTodaysSetter } from "@/lib/utils/rotation";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

const problemSchema = z.object({
  problem1Number: z.coerce.number().int().positive("Problem 1 number is required"),
  problem1Name: z.string().min(1, "Problem 1 name is required").max(200),
  problem2Number: z.coerce.number().int().positive("Problem 2 number is required"),
  problem2Name: z.string().min(1, "Problem 2 name is required").max(200),
});

// ──────────────────────────────────────────────
// Submit Daily Problems (setter only)
// ──────────────────────────────────────────────

export async function submitDailyProblems(
  teamId: string,
  _prevState: { error: string | null },
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  // Verify membership
  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!membership) return { error: "Not a team member" };

  // Verify this user is today's setter
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      memberships: {
        select: { userId: true, rotationPosition: true },
      },
    },
  });
  if (!team) return { error: "Team not found" };

  const todaysSetter = getTodaysSetter(team.createdAt, team.memberships);
  if (todaysSetter !== user.id) {
    return { error: "Only today's Problem Setter can submit problems" };
  }

  // Check if problems already set for today
  const today = getToday();
  const existing = await prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date: today } },
  });
  if (existing) {
    return { error: "Problems have already been set for today" };
  }

  // Validate input
  const rawData = {
    problem1Number: formData.get("problem1Number"),
    problem1Name: (formData.get("problem1Name") as string)?.trim(),
    problem2Number: formData.get("problem2Number"),
    problem2Name: (formData.get("problem2Name") as string)?.trim(),
  };

  const parsed = problemSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Create DailyProblem + log activity
  await prisma.$transaction([
    prisma.dailyProblem.create({
      data: {
        teamId,
        date: today,
        problemSetterId: user.id,
        problem1Number: parsed.data.problem1Number,
        problem1Name: parsed.data.problem1Name,
        problem2Number: parsed.data.problem2Number,
        problem2Name: parsed.data.problem2Name,
      },
    }),
    prisma.activityLog.create({
      data: {
        teamId,
        userId: user.id,
        type: "BECAME_SETTER",
        message: `${user.name} set today's problems`,
      },
    }),
  ]);

  revalidatePath(`/team/${teamId}`);
  return { error: null };
}

// ──────────────────────────────────────────────
// Admin Problem Override
// ──────────────────────────────────────────────

export async function adminResetDailyProblem(teamId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });
  if (!team || team.ownerId !== user.id) {
    return { error: "Only the team admin can reset problems" };
  }

  const today = getToday();
  const existing = await prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date: today } },
  });

  if (!existing) {
    return { error: "No problems set for today yet" };
  }

  await prisma.$transaction([
    prisma.dailyProblem.delete({
      where: { id: existing.id },
    }),
    prisma.activityLog.create({
      data: {
        teamId,
        userId: user.id,
        type: "BECAME_SETTER", // Repurposing type or we could just use a string
        message: `${user.name} (Admin) reset today's problems`,
      },
    }),
  ]);

  revalidatePath(`/team/${teamId}`);
  revalidatePath(`/team/${teamId}/admin`);
  return { error: null };
}

export async function adminSubmitDailyProblems(
  teamId: string,
  _prevState: { error: string | null },
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });
  if (!team || team.ownerId !== user.id) {
    return { error: "Only the team admin can force-set problems" };
  }

  const rawData = {
    problem1Number: formData.get("problem1Number"),
    problem1Name: (formData.get("problem1Name") as string)?.trim(),
    problem2Number: formData.get("problem2Number"),
    problem2Name: (formData.get("problem2Name") as string)?.trim(),
  };

  const parsed = problemSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const today = getToday();
  const existing = await prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date: today } },
  });

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.dailyProblem.delete({
        where: { id: existing.id },
      });
    }

    await tx.dailyProblem.create({
      data: {
        teamId,
        date: today,
        problemSetterId: user.id,
        problem1Number: parsed.data.problem1Number,
        problem1Name: parsed.data.problem1Name,
        problem2Number: parsed.data.problem2Number,
        problem2Name: parsed.data.problem2Name,
      },
    });

    await tx.activityLog.create({
      data: {
        teamId,
        userId: user.id,
        type: "BECAME_SETTER",
        message: `${user.name} (Admin) force-set today's problems`,
      },
    });
  });

  revalidatePath(`/team/${teamId}`);
  revalidatePath(`/team/${teamId}/admin`);
  return { error: null };
}

// ──────────────────────────────────────────────
// Get Today's Problems
// ──────────────────────────────────────────────

export async function getTodaysProblems(teamId: string) {
  const today = getToday();
  return prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date: today } },
    include: {
      problemSetter: {
        select: { id: true, name: true, username: true },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, username: true },
          },
        },
      },
    },
  });
}

// ──────────────────────────────────────────────
// Get Problems for a Specific Date (history)
// ──────────────────────────────────────────────

export async function getProblemsForDate(teamId: string, date: Date) {
  return prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date } },
    include: {
      problemSetter: {
        select: { id: true, name: true, username: true },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, username: true },
          },
        },
      },
    },
  });
}
