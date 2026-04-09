"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useGame } from "@/lib/game-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Rocket, History as HistoryIcon, TrendingUp, Wallet } from "lucide-react"
import { GameLayoutWrapper } from "@/components/game-layout-wrapper"
import { supabase } from "@/lib/supabase"

type GameState = "waiting" | "running" | "crashed" | "cashed_out"

export default function CrashGame() {
  const { balance = 0, addBalance, subtractBalance } = useGame()
  
  // Estados de UI
  const [betAmount, setBetAmount] = useState(100)
  const [autoCashout, setAutoCashout] = useState(2.00)
  const [gameState, setGameState] = useState<GameState>("waiting")
  const [multiplier, setMultiplier] = useState(1.00)
  const [hasBet, setHasBet] = useState(false)
  const [lastWin, setLastWin] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])
  
  // Referencias para el motor de animación y lógica
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pointsRef = useRef<{ x: number; y: number }[]>([])
  const isCrashedRef = useRef<boolean>(false)
  const multiplierRef = useRef<number>(1.00)
  
  // Refs para evitar clausuras obsoletas en el loop
  const gameStateRef = useRef<GameState>("waiting")
  const hasBetRef = useRef<boolean>(false)
  const autoCashoutRef = useRef<number>(2.00)

  // Sincronizar refs con estado
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { hasBetRef.current = hasBet }, [hasBet])
  useEffect(() => { autoCashoutRef.current = autoCashout }, [autoCashout])

  const handleCashOut = useCallback(async (currentMult: number) => {
    if (gameStateRef.current !== "running" || !hasBetRef.current) return
    
    const winAmount = Math.floor(betAmount * currentMult)
    await addBalance(winAmount)
    
    setLastWin(winAmount)
    setHasBet(false)
    hasBetRef.current = false
    setGameState("cashed_out")
  }, [betAmount, addBalance])

  // 1. Suscripción Realtime a prueba de fallas
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('public:rounds')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds' },
        (payload) => {
          console.log('[Realtime] Payload recibido:', payload)
          const data = payload.new as any
          if (!data) return

          const newStatus = data.status as GameState

          if (newStatus === "waiting") {
            // Reiniciar estado para nueva ronda
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            animationRef.current = null
            isCrashedRef.current = false
            startTimeRef.current = 0
            multiplierRef.current = 1.00
            pointsRef.current = [{ x: 0, y: 1 }]
            
            setMultiplier(1.00)
            setGameState("waiting")
            setLastWin(null)
          } 
          else if (newStatus === "running") {
            // Iniciar despegue
            isCrashedRef.current = false
            startTimeRef.current = performance.now()
            pointsRef.current = [{ x: 0, y: 1 }]
            
            // Si el usuario no ha cobrado, poner estado en running
            if (gameStateRef.current !== "cashed_out") {
              setGameState("running")
            }

            // Motor de Animación (60 FPS con requestAnimationFrame)
            const animate = (time: number) => {
              if (isCrashedRef.current) return

              const elapsed = (time - startTimeRef.current) / 1000
              if (elapsed >= 0) {
                // Fórmula: Math.exp(0.05 * t)
                const currentMult = Math.exp(0.05 * elapsed)
                const roundedMult = Math.floor(currentMult * 100) / 100
                
                multiplierRef.current = roundedMult
                setMultiplier(roundedMult)

                // Lógica de Auto-Cashout
                if (hasBetRef.current && autoCashoutRef.current > 1 && roundedMult >= autoCashoutRef.current) {
                  handleCashOut(roundedMult)
                }

                // Actualizar puntos para el gráfico
                pointsRef.current.push({ x: elapsed, y: currentMult })
                if (pointsRef.current.length > 1000) pointsRef.current.shift()
              }

              animationRef.current = requestAnimationFrame(animate)
            }
            
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            animationRef.current = requestAnimationFrame(animate)
          } 
          else if (newStatus === "crashed") {
            // Detener motor INMEDIATAMENTE
            isCrashedRef.current = true
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current)
              animationRef.current = null
            }

            const finalMultiplier = data.multiplier ?? data.crash_multiplier ?? multiplierRef.current
            setMultiplier(finalMultiplier)
            setGameState("crashed")
            setHasBet(false)
            hasBetRef.current = false
            setHistory(prev => [finalMultiplier, ...prev.slice(0, 9)])
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Estado suscripción:', status)
      })

    return () => {
      if (channel) supabase.removeChannel(channel)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [betAmount, addBalance, handleCashOut])

  // 2. Renderizado del Canvas (Independiente para máxima fluidez)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let renderId: number

    const draw = () => {
      const { width, height } = canvas
      const padding = 60
      ctx.clearRect(0, 0, width, height)

      // Fondo
      ctx.fillStyle = "#0f111a"
      ctx.fillRect(0, 0, width, height)

      // Dibujar cuadrícula
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i * (width - padding * 2)) / 10
        ctx.beginPath(); ctx.moveTo(x, padding); ctx.lineTo(x, height - padding); ctx.stroke()
        const y = padding + (i * (height - padding * 2)) / 10
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke()
      }

      // Dibujar Curva si hay puntos
      if (pointsRef.current.length > 1) {
        const lastP = pointsRef.current[pointsRef.current.length - 1]
        const maxX = Math.max(5, lastP.x)
        const maxY = Math.max(2, lastP.y * 1.2)

        ctx.beginPath()
        ctx.strokeStyle = gameState === "crashed" ? "#ef4444" : "#22c55e"
        ctx.lineWidth = 4
        ctx.lineJoin = "round"

        pointsRef.current.forEach((p, i) => {
          const x = padding + (p.x / maxX) * (width - padding * 2)
          const y = height - padding - ((p.y - 1) / (maxY - 1)) * (height - padding * 2)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        // Gradiente bajo la curva
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
        gradient.addColorStop(0, gameState === "crashed" ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)")
        gradient.addColorStop(1, "transparent")
        ctx.lineTo(padding + (lastP.x / maxX) * (width - padding * 2), height - padding)
        ctx.lineTo(padding, height - padding)
        ctx.fillStyle = gradient
        ctx.fill()

        // Rocket Point
        const rx = padding + (lastP.x / maxX) * (width - padding * 2)
        const ry = height - padding - ((lastP.y - 1) / (maxY - 1)) * (height - padding * 2)
        ctx.fillStyle = gameState === "crashed" ? "#ef4444" : "#fbbf24"
        ctx.beginPath()
        ctx.arc(rx, ry, 6, 0, Math.PI * 2)
        ctx.fill()
        if (gameState !== "crashed") {
          ctx.shadowBlur = 15; ctx.shadowColor = "#fbbf24"; ctx.fill(); ctx.shadowBlur = 0
        }
      }

      // Texto del Multiplicador Central
      const displayMult = (multiplier ?? 1.00).toFixed(2)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = "bold 72px Inter, system-ui, sans-serif"
      ctx.fillStyle = gameState === "crashed" ? "#ef4444" : "#ffffff"
      ctx.fillText(`${displayMult}x`, width / 2, height / 2)

      if (gameState === "waiting") {
        ctx.font = "16px Inter, sans-serif"
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
        ctx.fillText("ESPERANDO SIGUIENTE RONDA...", width / 2, height / 2 + 60)
      } else if (gameState === "crashed") {
        ctx.font = "bold 24px Inter, sans-serif"
        ctx.fillStyle = "#ef4444"
        ctx.fillText("¡BOOM!", width / 2, height / 2 + 60)
      }

      renderId = requestAnimationFrame(draw)
    }

    renderId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(renderId)
  }, [multiplier, gameState])

  const placeBet = async () => {
    if (gameState !== "waiting") return
    const success = await subtractBalance(betAmount)
    if (success) {
      setHasBet(true)
      hasBetRef.current = true
    }
  }

  const adjustBet = (mult: number) => {
    setBetAmount(prev => {
      const val = Math.floor(prev * mult)
      return Math.max(10, Math.min(balance ?? 0, val))
    })
  }

  return (
    <GameLayoutWrapper>
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-2">
              CRASH <TrendingUp className="text-primary h-8 w-8" />
            </h1>
            <p className="text-muted-foreground font-medium">Multiplica tus coins antes de que el cohete explote.</p>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {(history ?? []).map((val, i) => (
              <div 
                key={i} 
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border shrink-0",
                  (val ?? 0) >= 2 ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                )}
              >
                {(val ?? 1).toFixed(2)}x
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Game Visuals */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-2 border-border/50 bg-[#0f111a] relative group">
              <CardContent className="p-0">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={500}
                  className="w-full h-auto aspect-video cursor-crosshair"
                />
                
                {gameState === "crashed" && (
                  <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                )}
              </CardContent>
            </Card>

            {/* Mobile Controls / Stats Placeholder */}
            <div className="grid grid-cols-2 gap-4 md:hidden">
               <Card className="p-4 bg-secondary/20 border-none flex items-center gap-3">
                  <Wallet className="text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Saldo</p>
                    <p className="font-bold">{(balance ?? 0).toLocaleString()}</p>
                  </div>
               </Card>
               <Card className="p-4 bg-secondary/20 border-none flex items-center gap-3">
                  <HistoryIcon className="text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Última</p>
                    <p className="font-bold">{(history[0] ?? 1).toFixed(2)}x</p>
                  </div>
               </Card>
            </div>
          </div>

          {/* Betting Controls */}
          <div className="space-y-4">
            <Card className="border-2 border-border/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  Configurar Apuesta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                    <span>Monto</span>
                    <span>Min: 10</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="h-14 text-xl font-black pl-4 pr-32 bg-secondary/30 border-none focus-visible:ring-primary"
                      disabled={hasBet}
                    />
                    <div className="absolute right-2 top-2 bottom-2 flex gap-1">
                      <Button variant="ghost" size="sm" className="h-full px-2 font-bold hover:bg-primary/10" onClick={() => adjustBet(0.5)} disabled={hasBet}>½</Button>
                      <Button variant="ghost" size="sm" className="h-full px-2 font-bold hover:bg-primary/10" onClick={() => adjustBet(2)} disabled={hasBet}>2x</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                    <span>Auto Retiro</span>
                    <span>Opcional</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(Number(e.target.value))}
                    className="h-14 text-xl font-black bg-secondary/30 border-none focus-visible:ring-primary"
                    disabled={hasBet}
                  />
                </div>

                {!hasBet ? (
                  <Button
                    onClick={placeBet}
                    disabled={gameState !== "waiting"}
                    className="w-full h-16 text-lg font-black uppercase tracking-tighter bg-primary text-primary-foreground hover:scale-[1.02] transition-transform"
                  >
                    <Rocket className="mr-2 h-6 w-6" />
                    Apostar
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCashOut(multiplier)}
                    disabled={gameState !== "running"}
                    className="w-full h-16 text-lg font-black uppercase tracking-tighter bg-yellow-400 text-black hover:bg-yellow-300 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                  >
                    RETIRAR {(Math.floor(betAmount * (multiplier ?? 1))).toLocaleString()}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase">Tu Saldo Disponible</p>
                <p className="text-3xl font-black">{(balance ?? 0).toLocaleString()} <span className="text-sm font-medium text-muted-foreground">COINS</span></p>
              </div>
              <Wallet className="h-10 w-10 text-primary/40" />
            </div>

            {lastWin !== null && (
              <div className="bg-green-500 rounded-xl p-6 text-black text-center animate-in zoom-in-95 duration-300">
                <p className="text-xs font-black uppercase tracking-widest opacity-70">¡Ganancia!</p>
                <p className="text-4xl font-black">+{lastWin.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameLayoutWrapper>
  )
}
