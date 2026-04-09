import Link from "next/link"
import { 
  CircleDot, 
  Bomb, 
  TrendingUp, 
  Dices,
  Sparkles,
  Zap,
  Bird
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdBanner, AdContainer } from "@/components/ad-banner"

const games = [
  { 
    name: "Plinko", 
    href: "/games/plinko", 
    icon: CircleDot,
    description: "Drop the ball and watch it bounce through the pegs",
    color: "bg-[oklch(0.7_0.2_145)]",
    gradient: "from-[oklch(0.7_0.2_145)]/20 to-transparent"
  },
  { 
    name: "Mines", 
    href: "/games/mines", 
    icon: Bomb,
    description: "Reveal gems and avoid the hidden mines",
    color: "bg-[oklch(0.6_0.18_240)]",
    gradient: "from-[oklch(0.6_0.18_240)]/20 to-transparent"
  },
  { 
    name: "Crash", 
    href: "/games/crash", 
    icon: TrendingUp,
    description: "Cash out before the multiplier crashes",
    color: "bg-[oklch(0.65_0.22_30)]",
    gradient: "from-[oklch(0.65_0.22_30)]/20 to-transparent"
  },
  { 
    name: "Dice", 
    href: "/games/dice", 
    icon: Dices,
    description: "Roll the dice and predict the outcome",
    color: "bg-[oklch(0.75_0.15_85)]",
    gradient: "from-[oklch(0.75_0.15_85)]/20 to-transparent"
  },
  { 
    name: "Chicken", 
    href: "/games/chicken", 
    icon: Bird,
    description: "Cross the road and avoid getting hit",
    color: "bg-[oklch(0.7_0.18_60)]",
    gradient: "from-[oklch(0.7_0.18_60)]/20 to-transparent"
  },
]

export default function HomePage() {
  return (
    <div className="container py-8">
      {/* Top Ad Banner - Desktop */}
      <AdContainer className="hidden md:flex">
        <AdBanner size="leaderboard" />
      </AdContainer>
      
      {/* Top Ad Banner - Mobile */}
      <AdContainer className="md:hidden">
        <AdBanner size="mobile" />
      </AdContainer>

      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          100% Free - No Real Money
        </div>
        <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Play Casino Games
          <span className="block text-primary">For Fun</span>
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
          Experience the thrill of casino-style games without any real money. 
          Start with 10,000 free coins and enjoy unlimited gameplay.
        </p>
      </div>

      {/* Features */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Instant Play</p>
            <p className="text-sm text-muted-foreground">No registration needed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.75_0.15_85)]/20">
            <Sparkles className="h-5 w-5 text-[oklch(0.75_0.15_85)]" />
          </div>
          <div>
            <p className="font-semibold">10,000 Free Coins</p>
            <p className="text-sm text-muted-foreground">Reset anytime</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.6_0.18_240)]/20">
            <CircleDot className="h-5 w-5 text-[oklch(0.6_0.18_240)]" />
          </div>
          <div>
            <p className="font-semibold">Fair Games</p>
            <p className="text-sm text-muted-foreground">Provably random results</p>
          </div>
        </div>
      </div>

      {/* Mid-page Ad Banner - Desktop */}
      <AdContainer className="hidden md:flex">
        <AdBanner size="leaderboard" />
      </AdContainer>

      {/* Games Grid */}
      <h2 className="mb-6 text-2xl font-bold">Choose a Game</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((game) => (
          <Link key={game.href} href={game.href}>
            <Card className="group relative overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <CardHeader className="relative">
                <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg ${game.color}`}>
                  <game.icon className="h-6 w-6 text-background" />
                </div>
                <CardTitle className="text-lg">{game.name}</CardTitle>
                <CardDescription className="text-sm">
                  {game.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Play Now
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bottom Ad Banner */}
      <AdContainer className="hidden md:flex">
        <AdBanner size="leaderboard" />
      </AdContainer>
      
      <AdContainer className="md:hidden">
        <AdBanner size="mobile" />
      </AdContainer>

      {/* Disclaimer */}
      <div className="mt-8 rounded-lg border border-border/50 bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
        <p>
          <strong>Disclaimer:</strong> This is a free entertainment platform. No real money is involved. 
          All coins are virtual and have no monetary value.
        </p>
      </div>
    </div>
  )
}
