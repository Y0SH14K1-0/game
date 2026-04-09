import { GameProvider } from "@/lib/game-context"
import { GameHeader } from "@/components/game-header"
import { GameSidebar } from "@/components/game-sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GameProvider>
      <div className="min-h-screen bg-background">
        <GameHeader />
        <GameSidebar />
        <main className="pb-20 md:ml-64 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </GameProvider>
  )
}
