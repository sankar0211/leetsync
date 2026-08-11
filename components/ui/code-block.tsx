"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg border border-border/50 bg-muted/30 overflow-hidden my-2 w-full max-w-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/50">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{language}</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={copyToClipboard}>
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
        </Button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs bg-[#1e1e1e] text-gray-300 w-full">
        <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{code}</code>
      </pre>
    </div>
  );
}
