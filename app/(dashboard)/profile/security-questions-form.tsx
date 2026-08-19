"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { updateSecurityQuestions } from "@/lib/actions/recovery";

type QuestionItem = {
  question: string;
  answer: string;
};

export function SecurityQuestionsForm({
  initialQuestions = [],
  hasPlainPassword,
}: {
  initialQuestions?: QuestionItem[];
  hasPlainPassword: boolean;
}) {
  const [questions, setQuestions] = useState<QuestionItem[]>(
    initialQuestions.length > 0 ? initialQuestions : [{ question: "", answer: "" }]
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const addQuestion = () => {
    if (questions.length < 3) {
      setQuestions([...questions, { question: "", answer: "" }]);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQ = [...questions];
      newQ.splice(index, 1);
      setQuestions(newQ);
    }
  };

  const updateQuestion = (index: number, field: "question" | "answer", value: string) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("questions", JSON.stringify(questions));
    if (currentPassword) {
      formData.append("currentPassword", currentPassword);
    }

    const res = await updateSecurityQuestions({ error: null }, formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setCurrentPassword("");
    }
    setIsLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-6 mb-10">
      <CardHeader>
        <CardTitle>Security Questions</CardTitle>
        <CardDescription>
          Set up security questions to recover your password if you forget it.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {questions.map((q, i) => (
            <div key={i} className="space-y-4 p-4 border rounded-md relative bg-muted/20">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Question {i + 1}</h4>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeQuestion(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Hint Question</Label>
                <Input
                  placeholder="e.g. What was your childhood nickname?"
                  value={q.question}
                  onChange={(e) => updateQuestion(i, "question", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Input
                  placeholder="Your answer"
                  value={q.answer}
                  onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Answers will be converted to lowercase without spaces.
                </p>
              </div>
            </div>
          ))}

          {questions.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addQuestion}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Question
            </Button>
          )}

          {!hasPlainPassword && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Current Password</Label>
              <Input
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Since you didn't have a password saved for recovery, please enter it now.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-500">Security questions saved successfully!</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Security Questions
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
