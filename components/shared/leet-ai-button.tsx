"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useDragControls } from "framer-motion";
import { useState, useRef } from "react";

export function LeetAIButton() {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }
    window.open("https://chatgpt.com/g/g-6a6b7b2007608191bfe2517f175f2ae9-leet-ai", "_blank");
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
      drag
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }} // Gives a lot of room to drag
      dragElastic={0.1}
      dragMomentum={false}
      whileDrag={{ scale: 1.05 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        // Small delay to prevent click event firing right after drag ends
        setTimeout(() => setIsDragging(false), 150);
      }}
      className="fixed bottom-6 right-6 z-50 group touch-none cursor-grab active:cursor-grabbing"
    >
      <div
        onClick={handleClick}
        className="block relative"
      >
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 blur group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <Button 
          size="lg" 
          className="relative rounded-full h-14 pr-6 pl-5 gap-3 shadow-xl bg-background hover:bg-muted text-foreground border border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors"
        >
          <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-semibold tracking-tight text-sm">Leet AI</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Your Coding Agent</span>
          </div>
        </Button>
      </div>
    </motion.div>
  );
}
