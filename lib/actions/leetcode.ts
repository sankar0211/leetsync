"use server";

import { getCurrentUser } from "./auth";
import { prisma } from "@/lib/prisma";
import { toggleCompletion } from "./completions";

export async function verifyLeetCodeProblem(
  teamId: string, 
  dailyProblemId: string, 
  problemNumber: number, 
  problemSlug: string
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!user.leetcodeUsername) {
    return { error: "You must connect your LeetCode account first." };
  }

  try {
    // We fetch the recent 20 accepted submissions using the Alfa LeetCode API
    const response = await fetch(`https://alfa-leetcode-api.onrender.com/${user.leetcodeUsername}/acSubmission`, {
      cache: "no-store", // Don't cache so we get fresh submissions
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { error: "LeetCode account not found. Please check your username in profile settings." };
      }
      return { error: "Failed to connect to LeetCode API. Please try again later." };
    }

    const data = await response.json();
    
    // Safety check on API response structure
    if (!data || !Array.isArray(data.submission)) {
      return { error: "Invalid response from LeetCode. Your profile might be private." };
    }

    // Check if the required problem is in their recent accepted submissions
    const hasCompleted = data.submission.some(
      (sub: any) => sub.titleSlug === problemSlug
    );

    if (hasCompleted) {
      // It's verified, so let's mark it as completed using the existing logic
      const result = await toggleCompletion(
        teamId,
        dailyProblemId,
        problemNumber,
        true, // completed
        false // usedLeetAI (defaults to false for automated verification)
      );
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { success: true };
    }

    return { 
      error: "Problem not found in your recent submissions. If you solved it a long time ago, please submit your solution again on LeetCode to bring it to the top of your recent submissions." 
    };
    
  } catch (error) {
    console.error("Verification error:", error);
    return { error: "An unexpected error occurred during verification." };
  }
}
