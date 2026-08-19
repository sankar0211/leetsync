"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const securityQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(1, "Question cannot be empty"),
      answer: z.string().min(1, "Answer cannot be empty"),
    })
  ).min(1, "You must provide at least one security question")
   .max(3, "You can only have up to 3 security questions"),
  currentPassword: z.string().optional(),
});

/**
 * Normalizes an answer by converting it to lowercase and removing all spaces.
 */
function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().replace(/\s+/g, "");
}

/**
 * Updates the current user's security questions.
 * If the user doesn't have a plainPassword saved yet, they must provide their current password.
 */
export async function updateSecurityQuestions(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const questionsRaw = JSON.parse(formData.get("questions") as string || "[]");
    const currentPassword = formData.get("currentPassword") as string | undefined;

    const parsed = securityQuestionsSchema.safeParse({ questions: questionsRaw, currentPassword });
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    // Fetch the user to see if they already have a plainPassword
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return { error: "User not found" };

    let plainPasswordToSave = dbUser.plainPassword;

    if (!plainPasswordToSave) {
      if (!currentPassword) {
        return { error: "You must provide your current password so we can save it for recovery purposes." };
      }
      // Note: We are not verifying if the password is actually correct against Supabase here,
      // as Supabase doesn't expose a simple way to verify password without signing in again.
      // We will just trust they typed it correctly, or we could sign them in again to verify.
      plainPasswordToSave = currentPassword;
    }

    // Normalize answers
    const processedQuestions = parsed.data.questions.map((q) => ({
      question: q.question,
      answer: normalizeAnswer(q.answer),
    }));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        securityQuestions: processedQuestions,
        plainPassword: plainPasswordToSave,
      },
    });

    revalidatePath("/profile");
    return { error: null, success: true };
  } catch (error) {
    return { error: "Failed to process request" };
  }
}

/**
 * Retrieves security questions (without answers) for a given email.
 */
export async function getSecurityQuestionsForEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const dbUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { securityQuestions: true },
  });

  if (!dbUser || !dbUser.securityQuestions) {
    // Return a generic error to prevent email enumeration, or return empty
    return { error: "No security questions found for this email." };
  }

  const questions = dbUser.securityQuestions as { question: string; answer: string }[];
  if (questions.length === 0) {
    return { error: "No security questions found for this email." };
  }

  return {
    questions: questions.map((q) => q.question),
    error: null,
  };
}

/**
 * Validates answers for an email and returns the plainPassword if successful.
 */
export async function verifyAnswersAndRecover(
  email: string,
  answers: string[]
) {
  const normalizedEmail = email.toLowerCase().trim();
  const dbUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { securityQuestions: true, plainPassword: true },
  });

  if (!dbUser || !dbUser.securityQuestions) {
    return { error: "Verification failed." };
  }

  const questions = dbUser.securityQuestions as { question: string; answer: string }[];
  
  if (answers.length !== questions.length) {
    return { error: "Incorrect number of answers." };
  }

  for (let i = 0; i < questions.length; i++) {
    const expected = questions[i].answer;
    const provided = normalizeAnswer(answers[i]);
    if (expected !== provided) {
      return { error: "One or more answers are incorrect." };
    }
  }

  if (!dbUser.plainPassword) {
    return { error: "We verified your answers, but unfortunately your original password was not saved in our database. Please use standard password reset." };
  }

  return {
    password: dbUser.plainPassword,
    error: null,
  };
}
