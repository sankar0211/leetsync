"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { getSecurityQuestionsForEmail, verifyAnswersAndRecover } from "@/lib/actions/recovery";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [step, setStep] = useState<"email" | "questions" | "result">("email");
  const [recoveredPassword, setRecoveredPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetchQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await getSecurityQuestionsForEmail(email);
    if (res?.error) {
      setError(res.error);
    } else if (res?.questions) {
      setQuestions(res.questions);
      setAnswers(Array(res.questions.length).fill(""));
      setStep("questions");
    }
    
    setIsLoading(false);
  };

  const handleVerifyAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await verifyAnswersAndRecover(email, answers);
    if (res?.error) {
      setError(res.error);
    } else if (res?.password) {
      setRecoveredPassword(res.password);
      setStep("result");
    }
    
    setIsLoading(false);
  };

  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recover Password</CardTitle>
          <CardDescription>
            {step === "email" && "Enter your email to answer your security questions."}
            {step === "questions" && "Answer the questions below exactly as you set them up."}
            {step === "result" && "Recovery successful!"}
          </CardDescription>
        </CardHeader>
        
        {step === "email" && (
          <form onSubmit={handleFetchQuestions}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "questions" && (
          <form onSubmit={handleVerifyAnswers}>
            <CardContent className="space-y-6">
              {questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-sm font-medium">{q}</Label>
                  <Input
                    required
                    value={answers[i]}
                    onChange={(e) => updateAnswer(i, e.target.value)}
                    placeholder="Your answer"
                  />
                </div>
              ))}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep("email")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Answers
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "result" && (
          <>
            <CardContent className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                  Your password is:
                </p>
                <code className="text-lg font-mono font-bold tracking-wider break-all">
                  {recoveredPassword}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Please make sure to write it down securely. We strongly recommend changing it once you log in.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/login" className={buttonVariants({ className: "w-full" })}>
                Go to Login
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
