"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "Username must be lowercase alphanumeric with underscores only"
      ),
    leetcodeUsername: z
      .string()
      .min(1, "LeetCode Username is required")
      .max(30, "LeetCode Username must be at most 30 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ──────────────────────────────────────────────
// Sign Up
// ──────────────────────────────────────────────

export async function signUp(
  _prevState: { error: string | null },
  formData: FormData
) {
  const rawData = {
    name: formData.get("name") as string,
    username: (formData.get("username") as string)?.toLowerCase().trim(),
    leetcodeUsername: (formData.get("leetcodeUsername") as string)?.trim(),
    email: (formData.get("email") as string)?.toLowerCase().trim(),
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate
  const parsed = signUpSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, username, leetcodeUsername, email, password } = parsed.data;

  // Check username uniqueness
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUser) {
    return { error: "Username is already taken" };
  }

  // Check email uniqueness in our DB
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    return { error: "An account with this email already exists" };
  }

  // Create Supabase Auth user
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        username,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create account" };
  }

  // Create matching Prisma User row (id = auth user id)
  try {
    await prisma.user.create({
      data: {
        id: authData.user.id,
        name,
        username,
        leetcodeUsername,
        email,
        plainPassword: password,
      },
    });
  } catch {
    // If Prisma creation fails, we should clean up the auth user
    // but for simplicity, just return the error
    return { error: "Failed to create user profile. Please try again." };
  }

  redirect("/dashboard");
}

// ──────────────────────────────────────────────
// Sign In
// ──────────────────────────────────────────────

export async function signIn(
  _prevState: { error: string | null },
  formData: FormData
) {
  const rawData = {
    email: (formData.get("email") as string)?.toLowerCase().trim(),
    password: formData.get("password") as string,
  };

  const parsed = signInSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

// ──────────────────────────────────────────────
// Sign Out
// ──────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ──────────────────────────────────────────────
// Get Current User (server-side helper)
// ──────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return dbUser;
}
