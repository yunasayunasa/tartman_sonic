import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TitleScene } from './components/TitleScene';
import { ClearScene } from './components/ClearScene';
import { RefreshCw } from 'lucide-react';

function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER' | 'CLEAR'>('MENU');

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans text-zinc-100 p-4 overflow-hidden touch-none select-none">
      {gameState === 'MENU' && (
        <TitleScene onGameStart={() => setGameState('PLAYING')} />
      )}

      {gameState === 'PLAYING' && (
        <div className="relative flex flex-col items-center w-full max-w-4xl">
          <GameCanvas
            onGameOver={() => setGameState('GAME_OVER')}
            onGameClear={() => setGameState('CLEAR')}
          />
          <div className="absolute top-4 right-4 text-white/50 text-sm pointer-events-none bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm hidden md:block">
            WASD/Arrows · 2段ジャンプあり
          </div>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/60 to-black flex flex-col items-center justify-center z-50 gap-8">
          <div className="gameover-shake">
            <h1
              className="text-7xl md:text-9xl font-black tracking-widest text-center"
              style={{
                color: '#EF4444',
                textShadow: '0 0 30px #EF4444, 0 0 60px #DC2626, 0 0 100px #B91C1C, 5px 5px 0 #7F1D1D',
              }}
            >
              GAME OVER
            </h1>
          </div>
          <p className="text-zinc-400 text-xl">リングを持たずに倒れてしまった...</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold text-xl transition-all flex items-center gap-2 justify-center border border-red-900/60 hover:border-red-700 hover:scale-105"
            >
              <RefreshCw size={24} /> リトライ
            </button>
            <button
              onClick={() => setGameState('MENU')}
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full font-bold text-xl transition-all border border-zinc-700 hover:scale-105"
            >
              タイトルへ
            </button>
          </div>
        </div>
      )}

      {gameState === 'CLEAR' && (
        <div className="absolute inset-0 bg-black/85 z-50">
          <ClearScene
            onRetry={() => setGameState('PLAYING')}
            onMenu={() => setGameState('MENU')}
          />
        </div>
      )}
    </div>
  );
}

export default App;
