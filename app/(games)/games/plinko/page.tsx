"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useGame } from "@/lib/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { GameLayoutWrapper } from "@/components/game-layout-wrapper"

const ROWS = 12
const BALL_RADIUS = 8
const PEG_RADIUS = 4
const GRAVITY = 0.25
const BOUNCE = 0.5
const FRICTION = 0.99

interface Ball {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
  landed?: boolean
}

interface Peg {
  x: number
  y: number
}

interface PendingWin {
  amount: number
  multiplier: number
}

type Difficulty = "low" | "medium" | "high"

const difficultyConfigs: Record<Difficulty, { label: string; multipliers: number[] }> = {
  low: {
    label: "Low",
    multipliers: [5.6, 3.2, 1.6, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.6, 3.2, 5.6],
  },
  medium: {
    label: "Medium",
    multipliers: [33, 8, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 8, 33],
  },
  high: {
    label: "High",
    multipliers: [170, 48, 10, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 10, 48, 170],
  },
}

export default function PlinkoGame() {
  const { balance, addBalance, subtractBalance } = useGame()
  const [betAmount, setBetAmount] = useState(100)
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [lastWin, setLastWin] = useState<number | null>(null)
  const [lastMultiplier, setLastMultiplier] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const ballsRef = useRef<Ball[]>([])
  const pegsRef = useRef<Peg[]>([])
  const pendingWinsRef = useRef<PendingWin[]>([])

  const currentMultipliers = difficultyConfigs[difficulty].multipliers

  const canvasWidth = 500
  const canvasHeight = 600
  const pegSpacingX = canvasWidth / (ROWS + 2)
  const pegSpacingY = (canvasHeight - 120) / (ROWS + 1)

  // Initialize pegs
  useEffect(() => {
    const newPegs: Peg[] = []
    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 3
      const rowWidth = (pegsInRow - 1) * pegSpacingX
      const startX = (canvasWidth - rowWidth) / 2
      for (let col = 0; col < pegsInRow; col++) {
        newPegs.push({
          x: startX + col * pegSpacingX,
          y: 80 + row * pegSpacingY,
        })
      }
    }
    pegsRef.current = newPegs
  }, [pegSpacingX, pegSpacingY])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // Draw pegs
      pegsRef.current.forEach((peg) => {
        ctx.save()
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)"
        ctx.shadowBlur = 4
        ctx.beginPath()
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = "oklch(0.8 0.02 260)"
        ctx.fill()
        ctx.restore()
      })

      // Draw buckets
      const bucketWidth = canvasWidth / currentMultipliers.length
      currentMultipliers.forEach((mult, i) => {
        const x = i * bucketWidth
        const isHigh = mult >= 10
        const isMed = mult >= 1.5 && mult < 10
        ctx.fillStyle = isHigh
          ? "oklch(0.6 0.22 25)"
          : isMed
          ? "oklch(0.65 0.22 30)"
          : "oklch(0.3 0.02 260)"
        
        ctx.beginPath()
        ctx.roundRect(x + 2, canvasHeight - 45, bucketWidth - 4, 40, 4)
        ctx.fill()
        
        ctx.fillStyle = "white"
        ctx.font = "bold 10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`${mult}x`, x + bucketWidth / 2, canvasHeight - 20)
      })

      // Update and draw balls
      const currentBalls = ballsRef.current
      for (let i = currentBalls.length - 1; i >= 0; i--) {
        const ball = currentBalls[i]
        if (!ball.active) {
            // Remove inactive balls after some time
            if (Date.now() - ball.id > 1000) {
                currentBalls.splice(i, 1)
            }
            continue
        }

        ball.vx *= FRICTION
        ball.vy += GRAVITY
        ball.x += ball.vx
        ball.y += ball.vy

        // Peg collisions
        pegsRef.current.forEach((peg, index) => {
          const dx = ball.x - peg.x
          const dy = ball.y - peg.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const minDist = BALL_RADIUS + PEG_RADIUS

          if (distance < minDist) {
            const angle = Math.atan2(dy, dx)
            const overlap = minDist - distance
            ball.x += Math.cos(angle) * overlap
            ball.y += Math.sin(angle) * overlap

            // Reflection
            const normalX = dx / distance
            const normalY = dy / distance
            const dotProduct = ball.vx * normalX + ball.vy * normalY

            // Increased bounce for bottom rows to prevent sticking
            const isBottomRow = peg.y > canvasHeight - 150
            const currentBounce = isBottomRow ? BOUNCE * 1.5 : BOUNCE

            ball.vx = (ball.vx - 2 * dotProduct * normalX) * currentBounce
            ball.vy = (ball.vy - 2 * dotProduct * normalY) * currentBounce

            // Added randomness to prevent getting stuck
            ball.vx += (Math.random() - 0.5) * 1.5
            // Slight downward nudge on collision
            ball.vy += 0.5
          }
        })

        // Wall collisions
        if (ball.x < BALL_RADIUS) {
          ball.x = BALL_RADIUS
          ball.vx = Math.abs(ball.vx) * (BOUNCE * 1.2)
        }
        if (ball.x > canvasWidth - BALL_RADIUS) {
          ball.x = canvasWidth - BALL_RADIUS
          ball.vx = -Math.abs(ball.vx) * (BOUNCE * 1.2)
        }

        // Check if ball landed (with a bit of tolerance)
        if (ball.y > canvasHeight - 55 && !ball.landed) {
          const bucketIndex = Math.floor((ball.x / canvasWidth) * currentMultipliers.length)
          const clampedIndex = Math.max(0, Math.min(currentMultipliers.length - 1, bucketIndex))
          const multiplier = currentMultipliers[clampedIndex]
          
          pendingWinsRef.current.push({ amount: multiplier, multiplier })
          ball.active = false
          ball.landed = true
          continue
        }

        // Draw ball
        ctx.save()
        ctx.shadowColor = "rgba(255, 215, 0, 0.5)"
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = "#FFD700"
        ctx.fill()
        ctx.restore()
      }

      // Process pending wins
      if (pendingWinsRef.current.length > 0) {
        const wins = pendingWinsRef.current.splice(0, pendingWinsRef.current.length)
        wins.forEach(async (win) => {
          const winAmount = Math.floor(betAmount * win.amount)
          await addBalance(winAmount)
          setLastMultiplier(win.multiplier)
          setLastWin(winAmount)
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationRef.current)
  }, [betAmount, addBalance, difficulty, currentMultipliers])

  const dropBall = useCallback(async () => {
    if (!(await subtractBalance(betAmount))) return

    ballsRef.current.push({
      id: Date.now(),
      x: canvasWidth / 2 + (Math.random() - 0.5) * 20,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      active: true,
    })
  }, [betAmount, subtractBalance])

  const adjustBet = (multiplier: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(balance, Math.floor(prev * multiplier))))
  }

  return (
    <GameLayoutWrapper>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Plinko</h1>
          <p className="text-muted-foreground">Drop the ball and watch it bounce</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Game Canvas */}
          <Card className="overflow-hidden border-border/50 bg-card">
            <CardContent className="flex items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-w-full rounded-lg bg-[oklch(0.1_0.02_260)]"
              />
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
                    className="text-lg font-semibold"
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => adjustBet(0.5)}>
                      1/2
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => adjustBet(2)}>
                      2x
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setBetAmount(balance)}>
                      Max
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Risk</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(difficultyConfigs) as Difficulty[]).map((d) => (
                      <Button
                        key={d}
                        variant={difficulty === d ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setDifficulty(d)}
                        className="capitalize"
                      >
                        {difficultyConfigs[d].label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={dropBall}
                  disabled={balance < betAmount}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  size="lg"
                >
                  Drop Ball
                </Button>
              </CardContent>
            </Card>

            {lastWin !== null && (
              <Card className={cn(
                "border-border/50 transition-all",
                lastMultiplier && lastMultiplier >= 10 ? "border-primary bg-primary/10" : "bg-card"
              )}>
                <CardContent className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">Last Win</p>
                  <p className="text-2xl font-bold text-primary">
                    {lastWin.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lastMultiplier}x multiplier
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50 bg-card">
              <CardContent className="py-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Current Multipliers</p>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {currentMultipliers.map((m, i) => (
                    <span
                      key={i}
                      className={cn(
                        "rounded px-1.5 py-0.5",
                        m >= 10 ? "bg-primary/20 text-primary font-bold" : 
                        m >= 1.5 ? "bg-[oklch(0.65_0.22_30)]/20 text-[oklch(0.65_0.22_30)]" : 
                        "bg-secondary text-muted-foreground"
                      )}
                    >
                      {m}x
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GameLayoutWrapper>
  )
}
