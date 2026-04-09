"use client"

import { AdBanner, AdContainer } from "@/components/ad-banner"

interface GameLayoutWrapperProps {
  children: React.ReactNode
}

export function GameLayoutWrapper({ children }: GameLayoutWrapperProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:gap-6">
      {/* Main Game Area - Full width, no interference */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      {/* Side Ad - Only visible on extra large screens */}
      <div className="hidden xl:flex xl:flex-col xl:gap-4 xl:w-[320px] xl:shrink-0 xl:pt-8">
        <AdBanner size="rectangle" className="sticky top-20" />
      </div>
      
      {/* Bottom Ad - Visible on smaller screens, below the game */}
      <div className="xl:hidden">
        <AdContainer>
          <AdBanner size="mobile" className="md:hidden" />
          <AdBanner size="leaderboard" className="hidden md:flex" />
        </AdContainer>
      </div>
    </div>
  )
}
