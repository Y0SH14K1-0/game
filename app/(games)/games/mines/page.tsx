"use client"

import { useState, useCallback } from "react"
import { useGame } from "@/lib/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Bomb, Gem, HelpCircle } from "lucide-react"
import { GameLayoutWrapper } from "@/components/game-layout-wrapper"

const GRID_SIZE = 5
const TOTAL_TILES = GRID_SIZE * GRID_SIZE

interface Tile {
  isMine: boolean
  revealed: boolean
}

type RiskLevel = "low" | "medium" | "high" | "extreme"

const riskConfigs: Record<RiskLevel, { label: string; mines: number }> = {
  low: { label: "Low", mines: 3 },
  medium: { label: "Medium", mines: 5 },
  high: { label: "High", mines: 10 },
  extreme: { label: "Extreme", mines: 20 },
}

export default function MinesGame() {
  const { balance, addBalance, subtractBalance } = useGame()
  const [betAmount, setBetAmount] = useState(100)
  const [mineCount, setMineCount] = useState(5)
  const [grid, setGrid] = useState<Tile[]>([])
  const [gameActive, setGameActive] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [currentMultiplier, setCurrentMultiplier] = useState(1)

  const calculateMultiplier = useCallback((revealed: number, mines: number) => {
    const safeSpots = TOTAL_TILES - mines
    let multiplier = 1
    const houseEdge = 0.99 // 1% house edge
    for (let i = 0; i < revealed; i++) {
      multiplier *= (TOTAL_TILES - i) / (safeSpots - i)
    }
    return Math.floor(multiplier * houseEdge * 100) / 100
  }, [])

  const startGame = useCallback(async () => {
    if (!(await subtractBalance(betAmount))) return

    // Generate grid with mines
    const minePositions = new Set<number>()
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * TOTAL_TILES))
    }

    const newGrid: Tile[] = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      isMine: minePositions.has(i),
      revealed: false,
    }))

    setGrid(newGrid)
    setGameActive(true)
    setGameOver(false)
    setRevealedCount(0)
    setCurrentMultiplier(1)
  }, [betAmount, mineCount, subtractBalance])

  const revealTile = useCallback(async (index: number) => {
    if (!gameActive || grid[index].revealed || gameOver) return

    const newGrid = [...grid]
    newGrid[index] = { ...newGrid[index], revealed: true }
    setGrid(newGrid)

    if (newGrid[index].isMine) {
      // Game over - reveal all mines
      setGrid(newGrid.map(tile => tile.isMine ? { ...tile, revealed: true } : tile))
      setGameActive(false)
      setGameOver(true)
    } else {
      const newRevealedCount = revealedCount + 1
      setRevealedCount(newRevealedCount)
      const newMultiplier = calculateMultiplier(newRevealedCount, mineCount)
      setCurrentMultiplier(newMultiplier)

      // Check if all safe spots revealed
      if (newRevealedCount === TOTAL_TILES - mineCount) {
        const winAmount = Math.floor(betAmount * newMultiplier)
        await addBalance(winAmount)
        setGameActive(false)
      }
    }
  }, [gameActive, grid, gameOver, revealedCount, mineCount, betAmount, addBalance, calculateMultiplier])

  const cashOut = useCallback(async () => {
    if (!gameActive || revealedCount === 0) return
    const winAmount = Math.floor(betAmount * currentMultiplier)
    await addBalance(winAmount)
    setGameActive(false)
    // Reveal all tiles
    setGrid(grid.map(tile => ({ ...tile, revealed: true })))
  }, [gameActive, revealedCount, betAmount, currentMultiplier, addBalance, grid])

  const adjustBet = (multiplier: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, Math.floor(prev * multiplier))))
  }

  const potentialWin = Math.floor(betAmount * currentMultiplier)

  return (
    <GameLayoutWrapper>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mines</h1>
          <p className="text-muted-foreground">Reveal gems and avoid the mines</p>
        </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Game Grid */}
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center justify-center p-6">
            <div 
              className="grid gap-2"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                maxWidth: '400px',
                width: '100%'
              }}
            >
              {grid.length > 0 ? (
                grid.map((tile, index) => (
                  <button
                    key={index}
                    onClick={() => revealTile(index)}
                    disabled={!gameActive || tile.revealed}
                    className={cn(
                      "aspect-square rounded-lg transition-all duration-200 flex items-center justify-center",
                      !tile.revealed && "bg-secondary hover:bg-secondary/80 hover:scale-105",
                      tile.revealed && tile.isMine && "bg-[oklch(0.6_0.22_25)] scale-95",
                      tile.revealed && !tile.isMine && "bg-primary/20 scale-95"
                    )}
                  >
                    {tile.revealed ? (
                      tile.isMine ? (
                        <Bomb className="h-6 w-6 text-[oklch(0.95_0_0)]" />
                      ) : (
                        <Gem className="h-6 w-6 text-primary" />
                      )
                    ) : (
                      <HelpCircle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </button>
                ))
              ) : (
                Array.from({ length: TOTAL_TILES }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg bg-secondary/50 flex items-center justify-center"
                  >
                    <HelpCircle className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
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
                  disabled={gameActive}
                  className="text-lg font-semibold"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => adjustBet(0.5)} disabled={gameActive}>
                    1/2
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => adjustBet(2)} disabled={gameActive}>
                    2x
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setBetAmount(balance)} disabled={gameActive}>
                    Max
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(riskConfigs) as RiskLevel[]).map((level) => (
                    <Button
                      key={level}
                      variant={mineCount === riskConfigs[level].mines ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setMineCount(riskConfigs[level].mines)}
                      disabled={gameActive}
                      className="capitalize"
                    >
                      {riskConfigs[level].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mines Count</label>
                  <span className="text-sm font-semibold text-primary">{mineCount}</span>
                </div>
                <Slider
                  value={[mineCount]}
                  onValueChange={([value]) => setMineCount(value)}
                  min={1}
                  max={24}
                  step={1}
                  disabled={gameActive}
                  className="py-2"
                />
              </div>

              {!gameActive ? (
                <Button
                  onClick={startGame}
                  disabled={balance < betAmount}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  size="lg"
                >
                  Start Game
                </Button>
              ) : (
                <Button
                  onClick={cashOut}
                  disabled={revealedCount === 0}
                  className="w-full bg-[oklch(0.75_0.15_85)] text-[oklch(0.12_0_0)] hover:bg-[oklch(0.75_0.15_85)]/90 font-bold"
                  size="lg"
                >
                  Cash Out ({potentialWin.toLocaleString()})
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={cn(
            "border-border/50 transition-all",
            gameActive && revealedCount > 0 ? "border-primary bg-primary/10" : "bg-card"
          )}>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Multiplier</p>
                  <p className="text-2xl font-bold text-primary">{currentMultiplier}x</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Win</p>
                  <p className="text-2xl font-bold">{potentialWin.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Gems Found</span>
                <span className="font-semibold">{revealedCount} / {TOTAL_TILES - mineCount}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(revealedCount / (TOTAL_TILES - mineCount)) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </GameLayoutWrapper>
  )
}
