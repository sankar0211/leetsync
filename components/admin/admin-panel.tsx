"use client";

import { useState, useTransition } from "react";
import {
  removeMember,
  changeTeamPassword,
  transferOwnership,
  deleteTeam,
  updateRotationOrder,
} from "@/lib/actions/team";
import {
  adminResetDailyProblem,
  adminSubmitDailyProblems,
} from "@/lib/actions/problems";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface AdminPanelProps {
  teamId: string;
  teamName: string;
  ownerId: string;
  members: {
    userId: string;
    name: string;
    username: string;
    rotationPosition: number;
    avatarUrl?: string | null;
  }[];
}

export function AdminPanel({
  teamId,
  teamName,
  ownerId,
  members,
}: AdminPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState("");
  const [orderedMembers, setOrderedMembers] = useState(members);

  // Manage Problems state
  const [problem1Number, setProblem1Number] = useState("");
  const [problem1Name, setProblem1Name] = useState("");
  const [problem2Number, setProblem2Number] = useState("");
  const [problem2Name, setProblem2Name] = useState("");

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Manage Problems ──
  const handleResetProblems = () => {
    if (
      !confirm(
        "Are you sure you want to reset today's problems? This will PERMANENTLY delete any completions logged today by your team!"
      )
    )
      return;

    startTransition(async () => {
      const result = await adminResetDailyProblem(teamId);
      if (result.error) {
        showMessage("error", result.error);
      } else {
        showMessage("success", "Today's problems have been cleared");
      }
    });
  };

  const handleForceSetProblems = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const result = await adminSubmitDailyProblems(teamId, { error: null }, formData);
      if (result.error) {
        showMessage("error", result.error);
      } else {
        showMessage("success", "Today's problems have been force-set");
        setProblem1Number("");
        setProblem1Name("");
        setProblem2Number("");
        setProblem2Name("");
      }
    });
  };


  // ── Remove Member ──
  const handleRemoveMember = (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await removeMember(teamId, userId);
      if (result.error) {
        showMessage("error", result.error);
      } else {
        showMessage("success", `${name} has been removed`);
      }
    });
  };

  // ── Change Password ──
  const handleChangePassword = () => {
    if (newPassword !== confirmNewPassword) {
      showMessage("error", "Passwords don't match");
      return;
    }
    if (newPassword.length < 4) {
      showMessage("error", "Password must be at least 4 characters");
      return;
    }

    startTransition(async () => {
      const result = await changeTeamPassword(teamId, newPassword);
      if (result.error) {
        showMessage("error", result.error);
      } else {
        showMessage("success", "Team password updated");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    });
  };

  // ── Transfer Ownership ──
  const handleTransfer = () => {
    if (!selectedTransfer) return;
    const newOwner = members.find((m) => m.userId === selectedTransfer);
    if (
      !confirm(
        `Transfer ownership to ${newOwner?.name}? You will lose admin access.`
      )
    )
      return;

    startTransition(async () => {
      const result = await transferOwnership(teamId, selectedTransfer);
      if (result.error) {
        showMessage("error", result.error);
      } else {
        showMessage("success", "Ownership transferred");
      }
    });
  };

  // ── Reorder Rotation ──
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedMembers];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    setOrderedMembers(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === orderedMembers.length - 1) return;
    const newOrder = [...orderedMembers];
    [newOrder[index], newOrder[index + 1]] = [
      newOrder[index + 1],
      newOrder[index],
    ];
    setOrderedMembers(newOrder);
  };

  const handleSaveOrder = () => {
    startTransition(async () => {
      const result = await updateRotationOrder(
        teamId,
        orderedMembers.map((m) => m.userId)
      );
      if (result.error) {
        showMessage("error", result.error);
      } else {
        showMessage("success", "Rotation order updated");
      }
    });
  };

  // ── Delete Team ──
  const handleDelete = () => {
    if (deleteConfirm !== teamName) {
      showMessage("error", "Team name doesn't match");
      return;
    }
    startTransition(async () => {
      const result = await deleteTeam(teamId, deleteConfirm);
      if (result?.error) {
        showMessage("error", result.error);
      }
      // If successful, deleteTeam redirects
    });
  const problemsDataStr = JSON.stringify(
    [
      { number: parseInt(problem1Number, 10), name: problem1Name },
      { number: parseInt(problem2Number, 10), name: problem2Name }
    ].filter(p => !isNaN(p.number) && p.name.trim() !== "")
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg border text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* 0. Manage Today's Problems */}
      <Card className="border-border/50 border-orange-500/30 bg-orange-500/5">
        <CardHeader>
          <CardTitle className="text-base text-orange-500 flex items-center justify-between">
            Manage Today's Problems
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetProblems}
              disabled={isPending}
              type="button"
            >
              Clear Today's Problems
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Override the current setter and forcefully assign new problems. Note: Doing this will wipe any completions already made today.
          </p>
          <form onSubmit={handleForceSetProblems} className="space-y-4">
            <input type="hidden" name="problemsData" value={problemsDataStr} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="problem1Number" className="text-xs">Problem 1 Number</Label>
                <Input
                  id="problem1Number"
                  name="problem1Number"
                  type="number"
                  min="1"
                  required
                  value={problem1Number}
                  onChange={(e) => setProblem1Number(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem1Name" className="text-xs">Problem 1 Name</Label>
                <Input
                  id="problem1Name"
                  name="problem1Name"
                  required
                  value={problem1Name}
                  onChange={(e) => setProblem1Name(e.target.value)}
                  placeholder="e.g. Two Sum"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="problem2Number" className="text-xs">Problem 2 Number</Label>
                <Input
                  id="problem2Number"
                  name="problem2Number"
                  type="number"
                  min="1"
                  required
                  value={problem2Number}
                  onChange={(e) => setProblem2Number(e.target.value)}
                  placeholder="e.g. 200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem2Name" className="text-xs">Problem 2 Name</Label>
                <Input
                  id="problem2Name"
                  name="problem2Name"
                  required
                  value={problem2Name}
                  onChange={(e) => setProblem2Name(e.target.value)}
                  placeholder="e.g. Number of Islands"
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full" size="sm">
              {isPending ? "Applying Override..." : "Force Set Problems"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 1. Remove Member */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Remove Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members
              .filter((m) => m.userId !== ownerId)
              .map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div>
                    <span className="font-medium text-sm">{member.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      @{member.username}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleRemoveMember(member.userId, member.name)
                    }
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            {members.filter((m) => m.userId !== ownerId).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No other members to remove
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Change Password */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Change Team Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-xs">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 4 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword" className="text-xs">
              Confirm New Password
            </Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm password"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isPending || !newPassword}
            size="sm"
          >
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* 3. Rotation Order */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Rotation Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderedMembers.map((member, index) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-2 rounded bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs font-mono w-6 justify-center">
                  {index + 1}
                </Badge>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatarUrl || ""} alt={member.name} />
                  <AvatarFallback className="text-[10px] bg-emerald-500/20 text-emerald-400">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{member.name}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveDown(index)}
                  disabled={index === orderedMembers.length - 1}
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
          <Button
            onClick={handleSaveOrder}
            disabled={isPending}
            size="sm"
          >
            Save Order
          </Button>
        </CardContent>
      </Card>

      {/* 4. Transfer Ownership */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Transfer Ownership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="w-full p-2 rounded bg-muted border border-border text-sm"
            value={selectedTransfer}
            onChange={(e) => setSelectedTransfer(e.target.value)}
          >
            <option value="">Select new owner...</option>
            {members
              .filter((m) => m.userId !== ownerId)
              .map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} (@{m.username})
                </option>
              ))}
          </select>
          <Button
            onClick={handleTransfer}
            disabled={isPending || !selectedTransfer}
            size="sm"
          >
            Transfer
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* 5. Delete Team */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Delete Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This will permanently delete the team and all related data
            (problems, completions, activity). This action cannot be undone.
          </p>
          <div className="space-y-2">
            <Label htmlFor="deleteConfirm" className="text-xs">
              Type <strong>{teamName}</strong> to confirm
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={teamName}
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || deleteConfirm !== teamName}
            size="sm"
          >
            Delete Team Forever
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
