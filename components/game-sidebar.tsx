"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  CircleDot, 
  Bomb, 
  TrendingUp, 
  Dices,
  Home,
  Bird
} from "lucide-react"

const games = [
  { name: "Home", href: "/", icon: Home },
  { name: "Plinko", href: "/games/plinko", icon: CircleDot },
  { name: "Mines", href: "/games/mines", icon: Bomb },
  { name: "Crash", href: "/games/crash", icon: TrendingUp },
  { name: "Dice", href: "/games/dice", icon: Dices },
  { name: "Chicken", href: "/games/chicken", icon: Bird },
]

export function GameSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-64 border-r border-border/40 bg-sidebar md:block">
      <nav className="flex flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Games
        </p>
        {games.map((game) => {
          const isActive = pathname === game.href
          return (
            <Link
              key={game.href}
              href={game.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <game.icon className="h-5 w-5" />
              {game.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
