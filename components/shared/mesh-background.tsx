"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function MeshBackground() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 -z-50 bg-background" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-background transition-colors duration-500">
      <div className={`absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full filter blur-[100px] opacity-70 animate-blob ${isDark ? 'bg-indigo-900/50 mix-blend-screen' : 'bg-blue-200/50'}`}></div>
      <div className={`absolute top-[20%] right-[-10%] w-[55vw] h-[55vw] rounded-full filter blur-[120px] opacity-70 animate-blob animation-delay-2000 ${isDark ? 'bg-purple-900/40 mix-blend-screen' : 'bg-violet-200/40'}`}></div>
      <div className={`absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] rounded-full filter blur-[120px] opacity-70 animate-blob animation-delay-4000 ${isDark ? 'bg-slate-800/60 mix-blend-screen' : 'bg-cyan-100/50'}`}></div>
      
      {/* Noise overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    </div>
  );
}
