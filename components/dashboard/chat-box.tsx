"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "@/lib/actions/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Reply, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  teamId: string;
  userId: string;
  content: string;
  createdAt: Date;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      username: string;
    };
  } | null;
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isScrolledUpRef = useRef(false);

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

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Consider it scrolled up if distance to bottom > 100px
    isScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100;
  };

  useEffect(() => {
    // Auto-scroll to bottom on new messages, unless user scrolled up
    if (scrollRef.current && !isScrolledUpRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const content = input;
    const replyId = replyingTo?.id;
    const replyToCopy = replyingTo;
    setInput("");
    setReplyingTo(null);
    setIsSending(true);
    isScrolledUpRef.current = false; // Force auto-scroll on own message

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
        replyToId: replyId,
        replyTo: replyToCopy ? {
          id: replyToCopy.id,
          content: replyToCopy.content,
          user: replyToCopy.user,
        } : null,
        user: { id: currentUserId, name: "Sending...", username: "sending" },
      },
    ]);

    const res = await sendMessage(teamId, content, replyId);
    
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
      <CardContent className="flex-1 p-0 flex flex-col min-h-0 relative">
        <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
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
                      "flex flex-col max-w-[85%] group",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    {showHeader && (
                      <div
                        className={cn(
                          "flex items-baseline gap-2 mb-1 px-1",
                          isMe && "flex-row-reverse"
                        )}
                      >
                        <span className="text-xs font-medium text-foreground">
                          {isMe ? "You" : msg.user.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Intl.DateTimeFormat("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(msg.createdAt))}
                        </span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex items-center gap-2",
                      isMe && "flex-row-reverse"
                    )}>
                      {/* Reply Button (visible on hover) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleReply(msg)}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                      
                      <div
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm break-words relative",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        )}
                      >
                        {/* Reply Snippet */}
                        {msg.replyTo && (
                          <div
                            className={cn(
                              "mb-1.5 p-1.5 rounded text-xs border-l-2 flex flex-col",
                              isMe
                                ? "bg-primary-foreground/10 border-primary-foreground/50 text-primary-foreground/80"
                                : "bg-background/50 border-primary/50 text-muted-foreground"
                            )}
                          >
                            <span className="font-semibold text-[10px]">
                              {msg.replyTo.user.name}
                            </span>
                            <span className="truncate max-w-[200px]">
                              {msg.replyTo.content}
                            </span>
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Reply Banner */}
        {replyingTo && (
          <div className="absolute bottom-[60px] left-0 right-0 bg-muted/90 backdrop-blur border-y px-4 py-2 flex items-center justify-between z-10 text-sm">
            <div className="flex flex-col flex-1 min-w-0 mr-4 border-l-2 border-primary pl-2">
              <span className="text-xs font-semibold text-primary">
                Replying to {replyingTo.user.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {replyingTo.content}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="p-3 border-t bg-background relative z-20">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              ref={inputRef}
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
