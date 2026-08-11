"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "@/lib/actions/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Reply, X, Maximize2, Minimize2, MessageSquare, Code, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/ui/code-block";

type Message = {
  id: string;
  teamId: string;
  userId: string;
  content: string;
  type?: string;
  metadata?: any;
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
  currentUserName,
}: {
  teamId: string;
  currentUserId: string;
  currentUserName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [language, setLanguage] = useState("Python");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isScrolledUpRef = useRef(false);
  const channelRef = useRef<any>(null);
  const supabase = createClient();

  const fetchMessages = async () => {
    const res = await getMessages(teamId); // Fetches all types
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
    const channel = supabase.channel(`chat-typing-${teamId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing = new Set<string>();
        for (const key in state) {
          state[key].forEach((presence: any) => {
            if (presence.isTyping && presence.userId !== currentUserId) {
              typing.add(presence.name);
            }
          });
        }
        setTypingUsers(Array.from(typing));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, currentUserId, supabase]);

  useEffect(() => {
    if (channelRef.current?.state === 'joined') {
      channelRef.current.track({
        userId: currentUserId,
        name: currentUserName,
        isTyping: input.trim().length > 0,
      });
    }
  }, [input, currentUserId, currentUserName]);

  // Prevent background scrolling when in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

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
  }, [messages, activeTab]);

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
    const type = activeTab;
    const metadata = activeTab === "SOLUTION" ? { language } : null;

    setInput("");
    setReplyingTo(null);
    setIsSending(true);
    isScrolledUpRef.current = false;

    // Optimistic update
    const tempId = Math.random().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        teamId,
        userId: currentUserId,
        content,
        type,
        metadata,
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

    const res = await sendMessage(teamId, content, replyId, type as any, metadata);
    
    if (res.error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else {
      fetchMessages();
    }
    
    setIsSending(false);
  };

  const filteredMessages = messages.filter((m) => (m.type || "GENERAL") === activeTab);

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setIsFullscreen(false)} />
      )}
      <Card className={cn(
        "flex flex-col transition-all duration-300",
        isFullscreen 
          ? "fixed inset-4 md:inset-10 z-50 h-auto shadow-2xl" 
          : "h-[450px]"
      )}>
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Discussions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <TabsList className="grid grid-cols-3 w-full h-9">
              <TabsTrigger value="GENERAL" className="text-xs flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 hidden sm:block" /> General
              </TabsTrigger>
              <TabsTrigger value="SOLUTION" className="text-xs flex items-center gap-2">
                <Code className="h-3.5 w-3.5 hidden sm:block" /> Solutions
              </TabsTrigger>
              <TabsTrigger value="FEEDBACK" className="text-xs flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 hidden sm:block" /> Feedback
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="flex-1 p-0 flex flex-col min-h-0 relative">
            <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground pt-10">
                    {activeTab === "GENERAL" && "No messages yet. Say hello!"}
                    {activeTab === "SOLUTION" && "No solutions posted yet. Share your approach!"}
                    {activeTab === "FEEDBACK" && "No feedback yet. Share your thoughts or suggestions!"}
                  </div>
                ) : (
                  filteredMessages.map((msg, index) => {
                    const isMe = msg.userId === currentUserId;
                    const showHeader = index === 0 || filteredMessages[index - 1].userId !== msg.userId;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[90%] group",
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
                          "flex items-center gap-2 w-full",
                          isMe && "flex-row-reverse"
                        )}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={() => handleReply(msg)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                          
                          <div
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm break-words relative overflow-hidden",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted rounded-tl-none",
                              activeTab === "SOLUTION" ? "w-full min-w-[200px]" : ""
                            )}
                          >
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
                            
                            {activeTab === "SOLUTION" ? (
                              <CodeBlock code={msg.content} language={msg.metadata?.language || "Code"} />
                            ) : (
                              msg.content
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                    <div className="flex space-x-1 bg-muted px-2 py-1.5 rounded-full items-center">
                      <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>
                      {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing
                    </span>
                  </div>
                )}
              </div>
            </div>
            
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

            <div className="p-3 border-t bg-background relative z-20 flex flex-col gap-2">
              {activeTab === "SOLUTION" && (
                <div className="flex gap-2">
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-[150px]"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="C">C</option>
                    <option value="C++">C++</option>
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                  </select>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2 items-end">
                {activeTab === "SOLUTION" ? (
                  <textarea
                    ref={inputRef as any}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your solution code here..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
                  />
                ) : (
                  <Input
                    ref={inputRef as any}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeTab === "FEEDBACK" ? "Share your feedback/suggestions..." : "Type a message..."}
                    className="flex-1"
                    autoComplete="off"
                  />
                )}
                
                <Button type="submit" size="icon" className="mb-0 h-10 w-10 shrink-0" disabled={isSending || !input.trim()}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Tabs>
      </Card>
    </>
  );
}
