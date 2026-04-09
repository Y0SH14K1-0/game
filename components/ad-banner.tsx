"use client"

import { cn } from "@/lib/utils"

interface AdBannerProps {
  size: "leaderboard" | "rectangle" | "sidebar" | "mobile"
  className?: string
}

const sizeConfig = {
  leaderboard: {
    width: "w-full max-w-[728px]",
    height: "h-[90px]",
    label: "728 x 90"
  },
  rectangle: {
    width: "w-[300px]",
    height: "h-[250px]",
    label: "300 x 250"
  },
  sidebar: {
    width: "w-full",
    height: "h-[600px]",
    label: "160 x 600"
  },
  mobile: {
    width: "w-full max-w-[320px]",
    height: "h-[50px]",
    label: "320 x 50"
  }
}

export function AdBanner({ size, className }: AdBannerProps) {
  const config = sizeConfig[size]
  
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-secondary/20",
        config.width,
        config.height,
        className
      )}
    >
      {/* Placeholder content - replace with actual ad code */}
      <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
        <svg 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
          />
        </svg>
        <span className="text-xs font-medium">AD SPACE</span>
        <span className="text-[10px]">{config.label}</span>
      </div>
      
      {/* Corner label */}
      <span className="absolute right-2 top-1 text-[9px] uppercase tracking-wider text-muted-foreground/30">
        sponsored
      </span>
    </div>
  )
}

// Wrapper component for responsive ad placement
export function AdContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("flex items-center justify-center py-4", className)}>
      {children}
    </div>
  )
}
