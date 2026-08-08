"use client";

import { useState, useTransition } from "react";
import {
  removeMember,
  changeTeamPassword,
  transferOwnership,
  deleteTeam,
  updateRotationOrder,
} from "@/lib/actions/team";
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

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
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
  };

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
