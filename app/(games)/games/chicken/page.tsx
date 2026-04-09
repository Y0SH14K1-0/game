"use client"

import { useState, useCallback } from "react"
import { useGame } from "@/lib/game-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronDown, Coins } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdBanner, AdContainer } from "@/components/ad-banner"

const STEPS = 5
const CHOICES_PER_STEP = 3

type Difficulty = 'easy' | 'medium' | 'hard'

interface Cell {
  revealed: boolean
  isSafe: boolean
  isSelected: boolean
}

const difficultyConfig = {
  easy: { dangers: 1, label: 'Easy', multipliers: [1.2, 1.5, 2, 3, 5] },
  medium: { dangers: 1, label: 'Medium', multipliers: [1.3, 1.8, 2.5, 4, 7] },
  hard: { dangers: 2, label: 'Hard', multipliers: [1.5, 2.5, 4, 8, 15] },
}

export default function ChickenGame() {
  const { balance, addBalance, subtractBalance } = useGame()
  const [betAmount, setBetAmount] = useState(100)
  const [gameActive, setGameActive] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [grid, setGrid] = useState<Cell[][]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [lastResult, setLastResult] = useState<{ won: boolean; amount: number; step: number } | null>(null)
  const [chickenPath, setChickenPath] = useState<number[]>([])

  const multipliers = difficultyConfig[difficulty].multipliers

  const initializeGrid = useCallback(() => {
    const config = difficultyConfig[difficulty]
    const newGrid: Cell[][] = []
    
    for (let step = 0; step < STEPS; step++) {
      const stepCells: Cell[] = []
      const dangerIndices: Set<number> = new Set()
      
      while (dangerIndices.size < config.dangers) {
        dangerIndices.add(Math.floor(Math.random() * CHOICES_PER_STEP))
      }
      
      for (let choice = 0; choice < CHOICES_PER_STEP; choice++) {
        stepCells.push({
          revealed: false,
          isSafe: !dangerIndices.has(choice),
          isSelected: false
        })
      }
      newGrid.push(stepCells)
    }
    return newGrid
  }, [difficulty])

  const startGame = async () => {
    if (betAmount > balance || betAmount <= 0) return
    
    if (!(await subtractBalance(betAmount))) return
    setGrid(initializeGrid())
    setCurrentStep(0)
    setGameActive(true)
    setGameOver(false)
    setLastResult(null)
    setChickenPath([])
  }

  const selectCell = async (choiceIndex: number) => {
    if (!gameActive || gameOver) return
    if (currentStep >= STEPS) return

    const cell = grid[currentStep][choiceIndex]
    const newGrid = [...grid]
    
    // Mark selected cell
    newGrid[currentStep] = newGrid[currentStep].map((c, idx) => ({
      ...c,
      revealed: true,
      isSelected: idx === choiceIndex
    }))
    
    setGrid(newGrid)
    setChickenPath(prev => [...prev, choiceIndex])

    if (!cell.isSafe) {
      // Hit danger - game over
      setGameOver(true)
      setGameActive(false)
      setLastResult({ won: false, amount: betAmount, step: currentStep })
    } else {
      // Safe! Check if completed all steps
      if (currentStep === STEPS - 1) {
        const winAmount = Math.floor(betAmount * multipliers[currentStep])
        await addBalance(winAmount)
        setGameOver(true)
        setGameActive(false)
        setLastResult({ won: true, amount: winAmount, step: currentStep })
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const cashOut = async () => {
    if (!gameActive || currentStep === 0) return
    
    const winAmount = Math.floor(betAmount * multipliers[currentStep - 1])
    await addBalance(winAmount)
    setGameActive(false)
    setGameOver(true)
    setLastResult({ won: true, amount: winAmount, step: currentStep - 1 })
  }

  const getCurrentMultiplier = () => {
    if (currentStep === 0) return 1
    return multipliers[currentStep - 1]
  }

  const getPotentialWin = () => {
    return Math.floor(betAmount * getCurrentMultiplier())
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-[#1a1f2e] to-[#0d1117]">
      {/* Left Sidebar - Betting Controls */}
      <div className="w-72 flex-shrink-0 border-r border-white/10 bg-black/30 p-4 backdrop-blur-sm">
        {/* Bet Amount */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-white/50">
            Bet Amount
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={gameActive}
                className="h-10 border-white/20 bg-white/5 pl-8 text-white placeholder-white/30"
              />
              <Coins className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-500" />
            </div>
            <button
              onClick={() => setBetAmount(prev => Math.max(10, Math.floor(prev / 2)))}
              disabled={gameActive}
              className="rounded-lg bg-white/10 px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              ½
            </button>
            <button
              onClick={() => setBetAmount(prev => Math.min(balance, prev * 2))}
              disabled={gameActive}
              className="rounded-lg bg-white/10 px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              2x
            </button>
          </div>
        </div>

        {/* Difficulty Dropdown */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium text-white/50">
            Difficulty
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={gameActive}>
              <button className="flex h-10 w-full items-center justify-between rounded-lg border border-white/20 bg-white/5 px-3 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50">
                {difficultyConfig[difficulty].label}
                <ChevronDown className="h-4 w-4 text-white/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {(Object.keys(difficultyConfig) as Difficulty[]).map((diff) => (
                <DropdownMenuItem
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className="flex items-center justify-between"
                >
                  <span>{difficultyConfig[diff].label}</span>
                  <span className="text-xs text-muted-foreground">
                    {difficultyConfig[diff].dangers} danger{difficultyConfig[diff].dangers > 1 ? 's' : ''}/row
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Current Profit Display */}
        {gameActive && currentStep > 0 && (
          <div className="mb-4 rounded-lg bg-green-500/10 p-4 text-center">
            <p className="text-xs text-green-400/70">Current Profit</p>
            <p className="text-2xl font-bold text-green-400">
              +{(getPotentialWin() - betAmount).toLocaleString()}
            </p>
            <p className="text-xs text-green-400/70">
              {getCurrentMultiplier()}x multiplier
            </p>
          </div>
        )}

        {/* Main Action Button */}
        <div className="space-y-3">
          {!gameActive ? (
            <Button 
              onClick={startGame}
              disabled={betAmount > balance || betAmount <= 0}
              className="h-14 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-lg font-bold shadow-lg shadow-green-500/20 hover:from-green-400 hover:to-emerald-500"
            >
              BET
            </Button>
          ) : (
            <Button 
              onClick={cashOut}
              disabled={currentStep === 0}
              className="h-14 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-lg font-bold shadow-lg shadow-yellow-500/20 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none"
            >
              CASHOUT {getPotentialWin().toLocaleString()}
            </Button>
          )}
        </div>

        {/* Result Message */}
        {lastResult && (
          <div className={cn(
            "mt-4 rounded-lg p-3 text-center",
            lastResult.won ? "bg-green-500/20" : "bg-red-500/20"
          )}>
            {lastResult.won ? (
              <>
                <p className="text-sm font-bold text-green-400">You Won!</p>
                <p className="text-lg font-bold text-green-300">
                  +{(lastResult.amount - betAmount).toLocaleString()} coins
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-red-400">Game Over</p>
                <p className="text-lg font-bold text-red-300">
                  -{lastResult.amount.toLocaleString()} coins
                </p>
              </>
            )}
          </div>
        )}

        {/* Balance */}
        <div className="mt-6 rounded-lg bg-white/5 p-3 text-center">
          <p className="text-xs text-white/50">Balance</p>
          <p className="text-xl font-bold text-white">{balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-1 flex-col overflow-hidden p-6">
        {/* Step indicators with multipliers */}
        <div className="mb-4 flex justify-center gap-4">
          {multipliers.map((mult, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col items-center rounded-lg px-4 py-2 transition-all",
                idx < currentStep && gameActive
                  ? "bg-green-500/20 text-green-400"
                  : idx === currentStep && gameActive
                    ? "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/50"
                    : "bg-white/5 text-white/40"
              )}
            >
              <span className="text-xs">Step {idx + 1}</span>
              <span className="text-lg font-bold">{mult}x</span>
            </div>
          ))}
        </div>

        {/* Game Grid - Horizontal progression */}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-4">
            {/* Start position with chicken */}
            <div className="flex h-48 w-20 flex-col items-center justify-center rounded-xl bg-white/5">
              <div className={cn(
                "text-4xl transition-all",
                !gameActive && !gameOver && "animate-bounce"
              )}>
                🐔
              </div>
              <span className="mt-2 text-xs text-white/50">Start</span>
            </div>

            {/* Steps */}
            {Array.from({ length: STEPS }).map((_, stepIndex) => {
              const isCompleted = stepIndex < currentStep
              const isCurrent = stepIndex === currentStep && gameActive && !gameOver
              const isFuture = stepIndex > currentStep || !gameActive

              return (
                <div key={stepIndex} className="flex flex-col items-center gap-2">
                  {/* Arrow connector */}
                  <div className="mb-2 flex items-center">
                    <div className={cn(
                      "h-0.5 w-8 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-white/20"
                    )} />
                    <div className={cn(
                      "h-0 w-0 border-y-4 border-l-8 border-y-transparent transition-colors",
                      isCompleted ? "border-l-green-500" : "border-l-white/20"
                    )} />
                  </div>

                  {/* Choices for this step */}
                  <div className={cn(
                    "flex flex-col gap-2 rounded-xl p-3 transition-all",
                    isCurrent 
                      ? "bg-yellow-500/10 ring-2 ring-yellow-500/30" 
                      : isCompleted 
                        ? "bg-green-500/10" 
                        : "bg-white/5 opacity-50"
                  )}>
                    {Array.from({ length: CHOICES_PER_STEP }).map((_, choiceIndex) => {
                      const cell = grid[stepIndex]?.[choiceIndex]
                      const isSelected = cell?.isSelected
                      const wasChickenHere = chickenPath[stepIndex] === choiceIndex

                      return (
                        <button
                          key={choiceIndex}
                          onClick={() => selectCell(choiceIndex)}
                          disabled={!isCurrent}
                          className={cn(
                            "relative flex h-14 w-14 items-center justify-center rounded-lg border-2 transition-all",
                            cell?.revealed
                              ? cell.isSafe
                                ? "border-green-500/50 bg-green-500/20"
                                : "border-red-500/50 bg-red-500/20"
                              : isCurrent
                                ? "cursor-pointer border-yellow-500/30 bg-white/10 hover:border-yellow-500 hover:bg-white/20"
                                : "border-white/10 bg-white/5"
                          )}
                        >
                          {cell?.revealed ? (
                            cell.isSafe ? (
                              wasChickenHere ? (
                                <span className="text-2xl">🐔</span>
                              ) : (
                                <span className="text-xl">✓</span>
                              )
                            ) : (
                              <span className="text-2xl">💀</span>
                            )
                          ) : isCurrent ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-600/50 to-orange-600/50">
                              <span className="text-xl">🥚</span>
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-white/10" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Multiplier label */}
                  <span className={cn(
                    "text-sm font-bold transition-colors",
                    isCompleted ? "text-green-400" : isCurrent ? "text-yellow-400" : "text-white/30"
                  )}>
                    {multipliers[stepIndex]}x
                  </span>
                </div>
              )
            })}

            {/* Finish/Prize */}
            <div className="flex h-48 w-20 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <div className="text-4xl">🏆</div>
              <span className="mt-2 text-xs text-yellow-400">
                {multipliers[STEPS - 1]}x
              </span>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-4 text-center text-sm text-white/50">
          {gameActive && !gameOver ? (
            `Choose a safe path for the chicken. ${difficultyConfig[difficulty].dangers} danger(s) per step.`
          ) : lastResult?.won ? (
            "Congratulations! Start a new game to play again."
          ) : lastResult ? (
            "The chicken got caught! Try again."
          ) : (
            "Place your bet and help the chicken cross safely!"
          )}
        </div>
        
        {/* Bottom Ad - Mobile only */}
        <AdContainer className="mt-4 xl:hidden">
          <AdBanner size="mobile" className="md:hidden" />
          <AdBanner size="leaderboard" className="hidden md:flex" />
        </AdContainer>
      </div>
      
      {/* Side Ad - XL screens only */}
      <div className="hidden xl:flex xl:w-[320px] xl:flex-shrink-0 xl:items-start xl:p-4">
        <AdBanner size="rectangle" className="sticky top-20" />
      </div>
    </div>
  )
}
