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
  Bird,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const mainGames = [
  { name: "Home", href: "/", icon: Home },
  { name: "Plinko", href: "/games/plinko", icon: CircleDot },
  { name: "Mines", href: "/games/mines", icon: Bomb },
  { name: "Crash", href: "/games/crash", icon: TrendingUp },
]

const moreGames = [
  { name: "Dice", href: "/games/dice", icon: Dices },
  { name: "Chicken", href: "/games/chicken", icon: Bird },
]

export function MobileNav() {
  const pathname = usePathname()
  const isMoreActive = moreGames.some(g => pathname === g.href)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around py-2">
        {mainGames.map((game) => {
          const isActive = pathname === game.href
          return (
            <Link
              key={game.href}
              href={game.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <game.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {game.name}
            </Link>
          )
        })}
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(
            "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
            isMoreActive ? "text-primary" : "text-muted-foreground"
          )}>
            <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "text-primary")} />
            More
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mb-2">
            {moreGames.map((game) => (
              <DropdownMenuItem key={game.href} asChild>
                <Link href={game.href} className="flex items-center gap-2">
                  <game.icon className="h-4 w-4" />
                  {game.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
