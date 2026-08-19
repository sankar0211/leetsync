"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { getToday, getTodaysSetter, getTomorrow, getTomorrowsSetter } from "@/lib/utils/rotation";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// Validation & Helpers
// ──────────────────────────────────────────────

const problemSchema = z.object({
  problems: z.array(
    z.object({
      number: z.coerce.number().int().positive("Problem number is required"),
      name: z.string().min(1, "Problem name is required").max(200),
    })
  ).min(1, "At least one problem is required"),
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

  const isTomorrow = formData.get("isTomorrow") === "true";
  const targetDate = isTomorrow ? getTomorrow() : getToday();
  const dayName = isTomorrow ? "tomorrow's" : "today's";

  const todaysSetter = getTodaysSetter(team.createdAt, team.memberships);
  const tomorrowsSetter = getTomorrowsSetter(team.createdAt, team.memberships);
  const isAdmin = team.ownerId === user.id;

  const designatedSetter = isTomorrow ? tomorrowsSetter : todaysSetter;
  
  if (designatedSetter !== user.id && !isAdmin) {
    return { error: `Only ${dayName} Problem Setter (or the Admin) can submit/edit problems` };
  }

  // Check if problems already set for target date
  const existing = await prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date: targetDate } },
  });

  // Validate input
  let parsedProblems = [];
  try {
    parsedProblems = JSON.parse(formData.get("problemsData") as string || "[]");
  } catch (e) {
    return { error: "Invalid problems data format" };
  }

  const parsed = problemSchema.safeParse({ problems: parsedProblems });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Validate that these problems haven't been solved by the team before (excluding current problem if editing)
  const pastDailyProblems = await prisma.dailyProblem.findMany({
    where: { teamId },
    select: { id: true, problemsData: true, problem1Number: true, problem2Number: true },
  });

  const historicalProblemNumbers = new Set<number>();
  for (const dp of pastDailyProblems) {
    // If editing, don't flag the problems we are trying to edit
    if (existing && dp.id === existing.id) continue;

    if (dp.problemsData) {
      const pData = dp.problemsData as { number: number, name: string }[];
      pData.forEach(p => historicalProblemNumbers.add(p.number));
    }
    // Fallback for older data structure just in case
    if (dp.problem1Number) historicalProblemNumbers.add(dp.problem1Number);
    if (dp.problem2Number) historicalProblemNumbers.add(dp.problem2Number);
  }

  for (const p of parsed.data.problems) {
    if (historicalProblemNumbers.has(p.number)) {
      return { error: `Problem #${p.number} (${p.name}) has already been set for this team previously!` };
    }
  }

  // Create or Update DailyProblem + log activity
  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.dailyProblem.update({
        where: { id: existing.id },
        data: { problemsData: parsed.data.problems },
      });
      await tx.activityLog.create({
        data: {
          teamId,
          userId: user.id,
          type: "BECAME_SETTER", // Repurposing type
          message: `${user.name} edited ${dayName} problems`,
        },
      });
    } else {
      await tx.dailyProblem.create({
        data: {
          teamId,
          date: targetDate,
          problemSetterId: user.id,
          problemsData: parsed.data.problems,
        },
      });
      await tx.activityLog.create({
        data: {
          teamId,
          userId: user.id,
          type: "BECAME_SETTER",
          message: `${user.name} set ${dayName} problems`,
        },
      });
    }
  });

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

  let parsedProblems = [];
  try {
    parsedProblems = JSON.parse(formData.get("problemsData") as string || "[]");
  } catch (e) {
    return { error: "Invalid problems data format" };
  }

  const parsed = problemSchema.safeParse({ problems: parsedProblems });
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
        problemsData: parsed.data.problems,
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

export async function extendDailyProblem(teamId: string, dailyProblemId: string, extensionType: "TEAM" | "PERSONAL") {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });
  const dp = await prisma.dailyProblem.findUnique({
    where: { id: dailyProblemId },
  });

  if (!team || !dp || dp.teamId !== teamId) {
    return { error: "Not found" };
  }

  const now = new Date();

  if (extensionType === "TEAM") {
    // Must be admin or original setter
    if (team.ownerId !== user.id && dp.problemSetterId !== user.id) {
      return { error: "Only the admin or problem setter can extend time for the team" };
    }

    const currentExpiry = dp.extendedUntil && dp.extendedUntil > now ? dp.extendedUntil : now;
    const newExtension = new Date(currentExpiry.getTime() + 24 * 60 * 60 * 1000);

    await prisma.dailyProblem.update({
      where: { id: dailyProblemId },
      data: { extendedUntil: newExtension },
    });
  } else {
    // PERSONAL
    const membership = await prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
    });
    if (!membership) return { error: "Not a team member" };

    const personalExtensions = (dp.personalExtensions as any[]) || [];
    const existing = personalExtensions.find((p: any) => p.userId === user.id);
    const currentExpiry = existing && new Date(existing.extendedUntil) > now ? new Date(existing.extendedUntil) : now;
    const newExtension = new Date(currentExpiry.getTime() + 24 * 60 * 60 * 1000);

    const newPersonalExtensions = personalExtensions.filter((p: any) => p.userId !== user.id);
    newPersonalExtensions.push({ userId: user.id, extendedUntil: newExtension.toISOString() });

    await prisma.dailyProblem.update({
      where: { id: dailyProblemId },
      data: { personalExtensions: newPersonalExtensions },
    });
  }

  revalidatePath(`/team/${teamId}`);
  return { error: null };
}

export async function revokeDailyProblem(teamId: string, dailyProblemId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });
  const dp = await prisma.dailyProblem.findUnique({
    where: { id: dailyProblemId },
  });

  if (!team || !dp || dp.teamId !== teamId) {
    return { error: "Not found" };
  }

  // Must be admin
  if (team.ownerId !== user.id) {
    return { error: "Only the admin can revoke extended time" };
  }

  await prisma.dailyProblem.update({
    where: { id: dailyProblemId },
    data: { extendedUntil: null },
  });

  revalidatePath(`/team/${teamId}`);
  revalidatePath(`/team/${teamId}/history`);
  return { error: null };
}

// ──────────────────────────────────────────────
// Get Today's Problems & Active Extended Problems
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────

export async function getTodaysProblems(teamId: string) {
  const today = getToday();
  return prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date: today } },
    include: {
      problemSetter: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

export async function getTomorrowsProblems(teamId: string) {
  const tomorrow = getTomorrow();
  return prisma.dailyProblem.findUnique({
    where: { teamId_date: { teamId, date: tomorrow } },
    include: {
      problemSetter: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

export async function getActiveExtendedProblems(teamId: string, userId: string) {
  const today = getToday();
  const problems = await prisma.dailyProblem.findMany({
    where: {
      teamId,
      date: { not: today },
    },
    include: {
      problemSetter: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true }
  });
  const isAdmin = team?.ownerId === userId;
  const now = new Date();

  return problems.filter((dp) => {
    const isTeamExtended = dp.extendedUntil && dp.extendedUntil > now;
    const personalExtensions = (dp.personalExtensions as any[]) || [];
    const personalExt = personalExtensions.find((p: any) => p.userId === userId);
    const isPersonallyExtended = personalExt && new Date(personalExt.extendedUntil) > now;

    if (!isTeamExtended && !isPersonallyExtended) return false;
    if (isAdmin || dp.problemSetterId === userId) return true;

    const totalProblems = dp.problemsData ? (dp.problemsData as any[]).length : 2;
    const userCompletions = dp.completions.filter((c) => c.userId === userId && c.completed);
    return userCompletions.length < totalProblems;
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
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });
}
