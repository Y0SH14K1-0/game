import asyncio
import os
import random
import math
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Faltan las credenciales de Supabase en el archivo .env")

# Inicializar cliente de Supabase con Service Role Key para bypass de RLS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Configuraciones de Juego
PLINKO_CONFIG = {
    "low": [5.6, 3.2, 1.6, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.6, 3.2, 5.6],
    "medium": [33, 8, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 8, 33],
    "high": [170, 48, 10, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 10, 48, 170]
}

# --- LÓGICA DE JUEGOS BASADOS EN EVENTOS (Plinko, Dice, Chicken) ---

async def process_bet(bet_data):
    """Procesa una apuesta individual de forma autoritativa."""
    bet_id = bet_data['id']
    # Adaptado a las columnas de tu diagrama
    player_id = bet_data.get('player_id', bet_data.get('user_id'))
    game = bet_data.get('game', 'unknown')
    amount = bet_data.get('bet_amount', bet_data.get('amount', 0))
    params = bet_data.get('params', {})

    multiplier = 0

    # Lógica Provably Fair (Simulación)
    if game == "plinko":
        risk = params.get("risk", "medium")
        mults = PLINKO_CONFIG.get(risk, PLINKO_CONFIG["medium"])
        multiplier = random.choice(mults)

    elif game == "dice":
        target = params.get("target", 50)
        mode = params.get("mode", "under")
        roll = random.uniform(0, 100)
        win = (roll < target) if mode == "under" else (roll > target)
        if win:
            win_chance = target if mode == "under" else (100 - target)
            multiplier = round(99 / win_chance, 2)
        else:
            multiplier = 0

    elif game == "chicken":
        step = params.get("step", 0)
        difficulty = params.get("difficulty", "medium")
        success_chance = 0.66 if difficulty == "medium" else 0.8 if difficulty == "easy" else 0.33
        if random.random() < success_chance:
            multipliers = [1.3, 1.8, 2.5, 4, 7]
            multiplier = multipliers[min(step, len(multipliers)-1)]
        else:
            multiplier = 0

    win_amount = math.floor(amount * multiplier)

    # Actualizar apuesta en Supabase
    supabase.table("bets").update({
        "status": "completed",
        "cashout_multiplier": multiplier
    }).eq("id", bet_id).execute()

    if win_amount > 0:
        # Incrementar saldo del usuario en tu tabla 'players'
        try:
            player = supabase.table("players").select("balance").eq("id", player_id).single().execute()
            new_balance = player.data['balance'] + win_amount
            supabase.table("players").update({"balance": new_balance}).eq("id", player_id).execute()
        except Exception as e:
            print(f"❌ Error actualizando saldo del jugador {player_id}: {e}")

async def bets_listener():
    """Escucha nuevas apuestas en la tabla 'bets'."""
    print("🎧 Iniciando escuchador de apuestas (Plinko, Dice, Chicken)...")
    while True:
        try:
            # Consultar apuestas pendientes
            response = supabase.table("bets").select("*").eq("status", "pending").execute()
            bets = response.data

            if bets:
                tasks = [process_bet(bet) for bet in bets]
                await asyncio.gather(*tasks)

            await asyncio.sleep(0.5) # Polling suave
        except Exception as e:
            print(f"⚠️ Error en bets_listener: {e}")
            await asyncio.sleep(2)

# --- LÓGICA DE JUEGO CONTINUO (Crash) ---

async def crash_game_loop():
    """Bucle infinito que controla el estado global del juego Crash."""
    print("🚀 Iniciando bucle de Crash adaptado a tu tabla 'rounds'...")
    while True:
        try:
            # 1. Fase de Preparación
            crash_point = round(max(1.00, 100 / random.uniform(1, 100)), 2)

            # Creamos una NUEVA ronda
            response = supabase.table("rounds").insert({
                "crash_multiplier": crash_point,
                "status": "waiting"
            }).execute()
            
            round_id = response.data[0]['id']
            print(f"⏳ Nueva Ronda generada. ID: {str(round_id)[:8]}... (Apuestas abiertas 5s)")

            await asyncio.sleep(5) 

            # 2. Fase de Vuelo
            print(f"✈️ Vuelo iniciado. (🤫 Secreto: Explotará en {crash_point}x)")
            supabase.table("rounds").update({"status": "running"}).eq("id", round_id).execute()

            start_time = time.time()
            current_mult = 1.0

            while current_mult < crash_point:
                elapsed = time.time() - start_time
                current_mult = round(math.exp(0.05 * elapsed), 2)

                if current_mult >= crash_point:
                    break
                
                await asyncio.sleep(0.1)

            # 3. Fase de Crash
            print(f"💥 ¡CRASH en {crash_point}x!")
            supabase.table("rounds").update({
                "status": "crashed"
            }).eq("id", round_id).execute()

            await asyncio.sleep(4) # Pausa tras el crash

        except Exception as e:
            print(f"⚠️ Error en el bucle del Crash: {e}")
            await asyncio.sleep(2)

# --- MAIN ---

async def main():
    print("🎰 --- MEGA SERVIDOR DE CASINO INICIADO --- 🎰")
    print("Presiona Ctrl+C para detener todo.")
    print("-" * 50)
    
    await asyncio.gather(
        crash_game_loop(),
        bets_listener()
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido manualmente.")