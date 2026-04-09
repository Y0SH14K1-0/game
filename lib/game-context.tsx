"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { supabase } from './supabase'

interface GameContextType {
  balance: number
  loading: boolean
  userId: string | null
  addBalance: (amount: number) => Promise<void>
  subtractBalance: (amount: number) => Promise<boolean>
  resetBalance: () => Promise<void>
}

const GameContext = createContext<GameContextType | undefined>(undefined)

// Para este demo, usaremos un ID de usuario fijo si no hay sesión activa.
// En producción, esto vendría del auth de Supabase.
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000"

export function GameProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // 1. Inicializar sesión y cargar saldo
  useEffect(() => {
    const initializeUser = async () => {
      setLoading(true)
      
      try {
        // Intentar obtener el usuario actual de Supabase Auth
        const { data: { user } } = await supabase.auth.getUser()
        const currentId = user?.id || DEMO_USER_ID
        setUserId(currentId)

        // Obtener saldo inicial de la tabla 'players' usando maybeSingle para evitar errores si no existe
        const { data, error } = await supabase
          .from('players')
          .select('balance')
          .eq('id', currentId)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (!data) {
          // Si el jugador no existe, lo creamos automáticamente
          console.log("Nuevo jugador detectado, creando registro...")
          const { error: insertError } = await supabase
            .from('players')
            .insert({ 
              id: currentId, 
              username: 'DemoPlayer', 
              balance: 10000 
            })

          if (insertError) {
            console.error("Error creando jugador:", insertError.message)
            setBalance(10000) // Fallback local
          } else {
            setBalance(10000)
          }
        } else {
          setBalance(data.balance)
        }
      } catch (err: any) {
        console.error("Error en initializeUser:", err.message)
        setBalance(10000) // Fallback de emergencia
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [])

  // 2. Suscribirse a cambios en tiempo real del saldo
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`player-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log("Saldo actualizado en tiempo real:", payload.new.balance)
          setBalance(payload.new.balance)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // 3. Métodos de actualización (Autoritativos)
  // Nota: Estos métodos ahora interactúan con la base de datos
  const addBalance = useCallback(async (amount: number) => {
    if (!userId) return
    
    // Llamamos a la función RPC que definimos en el backend
    const { error } = await supabase.rpc('increment_balance', { 
      user_id: userId, 
      amount: amount 
    })

    if (error) console.error("Error al añadir saldo:", error.message)
  }, [userId])

  const subtractBalance = useCallback(async (amount: number) => {
    if (!userId || balance < amount) return false

    // En un sistema autoritativo, restamos saldo insertando una apuesta
    // o llamando a un RPC que valide el saldo antes de restar.
    const { error } = await supabase.rpc('decrement_balance', { 
      user_id: userId, 
      amount: amount 
    })

    if (error) {
      console.error("Error al restar saldo:", error.message)
      return false
    }
    
    // El balance se actualizará automáticamente mediante el Realtime
    return true
  }, [userId, balance])

  const resetBalance = useCallback(async () => {
    if (!userId) return
    const { error } = await supabase
      .from('players')
      .update({ balance: 10000 })
      .eq('id', userId)

    if (error) console.error("Error al resetear saldo:", error.message)
  }, [userId])

  return (
    <GameContext.Provider value={{ balance, loading, userId, addBalance, subtractBalance, resetBalance }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
