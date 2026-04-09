"use client"

import { useGame } from "@/lib/game-context"
import { Button } from "@/components/ui/button"
import { Coins, RotateCcw, Gamepad2 } from "lucide-react"
import Link from "next/link"

export function GameHeader() {
  const { balance, resetBalance } = useGame()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">FunPlay</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Coins className="h-5 w-5 text-[oklch(0.75_0.15_85)]" />
            <span className="font-semibold tabular-nums">
              {(balance || 0).toLocaleString()}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={resetBalance}
            title="Reset balance to 10,000"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
