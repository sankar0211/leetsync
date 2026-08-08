"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "@/lib/actions/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  teamId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
  };
};

export function ChatBox({
  teamId,
  currentUserId,
}: {
  teamId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await getMessages(teamId);
    if (res.messages) {
      setMessages(res.messages as any);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const content = input;
    setInput("");
    setIsSending(true);

    // Optimistic update
    const tempId = Math.random().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        teamId,
        userId: currentUserId,
        content,
        createdAt: new Date(),
        user: { id: currentUserId, name: "Sending...", username: "sending" },
      },
    ]);

    const res = await sendMessage(teamId, content);
    
    if (res.error) {
      // Revert optimistic update on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else {
      // Fetch latest to ensure proper order and IDs
      fetchMessages();
    }
    
    setIsSending(false);
  };

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Team Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground pt-10">
                No messages yet. Be the first to say hello!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.userId === currentUserId;
                const showHeader =
                  index === 0 || messages[index - 1].userId !== msg.userId;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    {showHeader && (
                      <span className="text-xs text-muted-foreground mb-1 px-1">
                        {isMe ? "You" : msg.user.name}
                      </span>
                    )}
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm break-words",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t bg-background">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
