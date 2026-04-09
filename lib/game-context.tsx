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

// Generador de UUID v4 simple para navegadores que no soportan crypto.randomUUID()
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // 1. Inicializar sesión de invitado o Auth
  useEffect(() => {
    const initializeUser = async () => {
      setLoading(true)
      
      try {
        let currentId: string | null = null

        // A. Intentar obtener el usuario de Supabase Auth
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          currentId = user.id
        } else {
          // B. Buscar ID de Invitado en LocalStorage
          const storedGuestId = localStorage.getItem('bet_guest_id')
          if (storedGuestId) {
            currentId = storedGuestId
          } else {
            // C. Generar nuevo UUID si no existe
            const newGuestId = typeof crypto?.randomUUID === 'function' 
              ? crypto.randomUUID() 
              : generateUUID()
            
            localStorage.setItem('bet_guest_id', newGuestId)
            currentId = newGuestId
            console.log("Nueva cuenta de invitado generada:", currentId)
          }
        }

        setUserId(currentId)

        // Obtener saldo de la tabla 'players'
        const { data, error } = await supabase
          .from('players')
          .select('balance')
          .eq('id', currentId)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          // Si el jugador no existe (es nuevo), lo creamos
          const { error: insertError } = await supabase
            .from('players')
            .insert({ 
              id: currentId, 
              username: `Guest_${currentId.substring(0, 5)}`, 
              balance: 10000 
            })

          if (insertError) {
            console.error("Error al registrar nuevo invitado:", insertError.message)
            setBalance(10000)
          } else {
            setBalance(10000)
          }
        } else {
          setBalance(data.balance)
        }
      } catch (err: any) {
        console.error("Error en initializeUser:", err.message)
        setBalance(10000)
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [])

  // 2. Suscribirse a cambios en tiempo real
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
          setBalance(payload.new.balance)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const addBalance = useCallback(async (amount: number) => {
    if (!userId) return
    const { error } = await supabase.rpc('increment_balance', { 
      user_id: userId, 
      amount: amount 
    })
    if (error) console.error("Error al añadir saldo:", error.message)
  }, [userId])

  const subtractBalance = useCallback(async (amount: number) => {
    if (!userId || balance < amount) return false
    const { error } = await supabase.rpc('decrement_balance', { 
      user_id: userId, 
      amount: amount 
    })
    if (error) {
      console.error("Error al restar saldo:", error.message)
      return false
    }
    return true
  }, [userId, balance])

  const resetBalance = useCallback(async () => {
    if (!userId) return
    await supabase.from('players').update({ balance: 10000 }).eq('id', userId)
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
