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
    // We fetch the recent 20 accepted submissions directly from LeetCode's public GraphQL API
    const query = `
      query getRecentSubmissionList($username: String!) {
        recentAcSubmissionList(username: $username, limit: 20) {
          titleSlug
        }
      }
    `;

    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
      },
      body: JSON.stringify({
        query,
        variables: { username: user.leetcodeUsername }
      }),
      cache: "no-store", // Don't cache so we get fresh submissions
    });

    if (!response.ok) {
      return { error: "Failed to connect to LeetCode API. Please try again later." };
    }

    const data = await response.json();
    
    // Safety check on API response structure
    const submissions = data?.data?.recentAcSubmissionList;
    if (!submissions || !Array.isArray(submissions)) {
      return { error: "Invalid response from LeetCode. Your profile might be private or username is incorrect." };
    }

    // Check if the required problem is in their recent accepted submissions
    const hasCompleted = submissions.some(
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
