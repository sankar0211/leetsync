"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/lib/actions/profile";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  user,
}: {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  };
}) {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Create a local preview URL
      setAvatarUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    let finalAvatarUrl = avatarUrl;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError("Error uploading image. Did you create the public 'avatars' bucket?");
        setIsLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      finalAvatarUrl = data.publicUrl;
    }

    const res = await updateProfile({ name, avatarUrl: finalAvatarUrl });
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setFile(null); // Clear file so it doesn't re-upload
    }
    setIsLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-2xl bg-emerald-500/20 text-emerald-400">{initials}</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <Label htmlFor="avatarFile">Profile Image</Label>
              <Input
                id="avatarFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Upload a new profile picture.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={user.username}
              disabled
              className="bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Your username cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-500">Profile updated successfully!</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
