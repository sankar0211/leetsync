"use client";

import { useState } from "react";
import { updateLeetcodeUsername } from "@/lib/actions/profile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LeetCodeSetupModal({ isOpen }: { isOpen: boolean }) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError("Please enter a valid LeetCode username");
      return;
    }

    setIsLoading(true);
    const result = await updateLeetcodeUsername(username);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      toast.success("LeetCode username saved!");
      // Since it's a server action with revalidatePath, the layout will reload and hide the modal
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Connect Your LeetCode Account</DialogTitle>
          <DialogDescription>
            We've upgraded our system to automatically track your problem completions! 
            To continue using LeetSync, please provide your exact LeetCode username.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="lc-username">LeetCode Username</Label>
            <Input
              id="lc-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your official LeetCode handle"
              autoComplete="off"
              disabled={isLoading}
            />
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !username.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save and Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
