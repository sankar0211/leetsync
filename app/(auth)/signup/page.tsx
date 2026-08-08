"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, {
    error: null as string | null,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2 flex justify-center">
            <img src="/logo-stacked-light.png" alt="LeetSync" className="h-24 w-auto block dark:hidden object-contain" />
            <img src="/logo-stacked-dark.png" alt="LeetSync" className="h-24 w-auto hidden dark:block object-contain" />
          </div>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Join your friends and stay accountable on LeetCode
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {state.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                {state.error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="lowercase_only"
                required
                autoComplete="username"
                pattern="^[a-z0-9_]+$"
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                3-20 chars, lowercase letters, numbers, and underscores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline transition-colors"
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
