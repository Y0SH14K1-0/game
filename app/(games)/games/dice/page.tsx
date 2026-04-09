"use client"

import { useState, useCallback } from "react"
import { useGame } from "@/lib/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, ChevronDown, ChevronUp } from "lucide-react"
import { GameLayoutWrapper } from "@/components/game-layout-wrapper"

type RollMode = "under" | "over"

export default function DiceGame() {
  const { balance, addBalance, subtractBalance } = useGame()
  const [betAmount, setBetAmount] = useState(100)
  const [target, setTarget] = useState(50)
  const [mode, setMode] = useState<RollMode>("under")
  const [isRolling, setIsRolling] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [lastWin, setLastWin] = useState<boolean | null>(null)
  const [history, setHistory] = useState<{ result: number; win: boolean }[]>([])

  const winChance = mode === "under" ? target : 100 - target
  const multiplier = Math.floor((99 / winChance) * 100) / 100

  const roll = useCallback(async () => {
    if (!(await subtractBalance(betAmount))) return
    
    setIsRolling(true)
    setResult(null)
    setLastWin(null)

    // Animate rolling
    let rollCount = 0
    const rollInterval = setInterval(async () => {
      setResult(Math.floor(Math.random() * 10000) / 100)
      rollCount++
      if (rollCount >= 15) {
        clearInterval(rollInterval)
        
        // Final result
        const finalResult = Math.floor(Math.random() * 10000) / 100
        setResult(finalResult)
        
        const isWin = mode === "under" 
          ? finalResult < target 
          : finalResult > target
        
        setLastWin(isWin)
        setHistory(prev => [{ result: finalResult, win: isWin }, ...prev.slice(0, 9)])
        
        if (isWin) {
          const winAmount = Math.floor(betAmount * multiplier)
          await addBalance(winAmount)
        }
        
        setIsRolling(false)
      }
    }, 50)
  }, [betAmount, target, mode, multiplier, subtractBalance, addBalance])

  const adjustBet = (mult: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, Math.floor(prev * mult))))
  }

  const toggleMode = () => {
    setMode(prev => prev === "under" ? "over" : "under")
  }

  return (
    <GameLayoutWrapper>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dice</h1>
          <p className="text-muted-foreground">Roll the dice and predict the outcome</p>
        </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Game Display */}
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center justify-center gap-8 p-8">
            {/* Result Display */}
            <div className="text-center">
              <div 
                className={cn(
                  "mb-4 flex h-32 w-48 items-center justify-center rounded-2xl text-5xl font-bold transition-all",
                  result === null && "bg-secondary text-muted-foreground",
                  lastWin === true && "bg-primary/20 text-primary",
                  lastWin === false && "bg-[oklch(0.6_0.22_25)]/20 text-[oklch(0.6_0.22_25)]",
                  isRolling && "animate-pulse"
                )}
              >
                {result !== null ? result.toFixed(2) : "??.??"}
              </div>
              {lastWin !== null && !isRolling && (
                <p className={cn(
                  "text-lg font-semibold",
                  lastWin ? "text-primary" : "text-[oklch(0.6_0.22_25)]"
                )}>
                  {lastWin ? `You Won ${Math.floor(betAmount * multiplier).toLocaleString()}!` : "Better luck next time!"}
                </p>
              )}
            </div>

            {/* Slider */}
            <div className="w-full max-w-md space-y-4">
              <div className="relative h-4 rounded-full bg-secondary overflow-hidden">
                <div 
                  className={cn(
                    "absolute h-full transition-all",
                    mode === "under" ? "left-0 bg-primary" : "right-0 bg-primary"
                  )}
                  style={{ width: `${winChance}%` }}
                />
                {result !== null && (
                  <div 
                    className={cn(
                      "absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-all",
                      lastWin ? "bg-primary" : "bg-[oklch(0.6_0.22_25)]"
                    )}
                    style={{ left: `${result}%` }}
                  />
                )}
              </div>
              
              <Slider
                value={[target]}
                onValueChange={([value]) => setTarget(value)}
                min={2}
                max={98}
                step={1}
                disabled={isRolling}
                className="py-4"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">0</span>
                <span className="font-semibold">Target: {target}</span>
                <span className="text-muted-foreground">100</span>
              </div>
            </div>

            {/* Mode Toggle */}
            <Button
              variant="outline"
              onClick={toggleMode}
              disabled={isRolling}
              className="gap-2"
            >
              {mode === "under" ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Roll Under {target}
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Roll Over {target}
                </>
              )}
              <ArrowLeftRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Bet Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bet Amount</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(10, Math.min(balance, Number(e.target.value))))}
                  min={10}
                  max={balance}
                  disabled={isRolling}
                  className="text-lg font-semibold"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => adjustBet(0.5)} disabled={isRolling}>
                    1/2
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => adjustBet(2)} disabled={isRolling}>
                    2x
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setBetAmount(balance)} disabled={isRolling}>
                    Max
                  </Button>
                </div>
              </div>

              <Button
                onClick={roll}
                disabled={balance < betAmount || isRolling}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                {isRolling ? "Rolling..." : "Roll Dice"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="py-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Multiplier</p>
                  <p className="text-xl font-bold text-primary">{multiplier}x</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Chance</p>
                  <p className="text-xl font-bold">{winChance}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit</p>
                  <p className="text-xl font-bold text-[oklch(0.75_0.15_85)]">
                    {Math.floor(betAmount * multiplier - betAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Roll History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {history.length > 0 ? (
                  history.map((h, i) => (
                    <span
                      key={i}
                      className={cn(
                        "rounded px-2 py-1 text-sm font-semibold",
                        h.win 
                          ? "bg-primary/20 text-primary" 
                          : "bg-[oklch(0.6_0.22_25)]/20 text-[oklch(0.6_0.22_25)]"
                      )}
                    >
                      {h.result.toFixed(2)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No rolls yet</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </GameLayoutWrapper>
  )
}
