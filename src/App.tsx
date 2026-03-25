import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TitleScene } from './components/TitleScene';
import { ClearScene } from './components/ClearScene';
import { RefreshCw } from 'lucide-react';
import type { GameResult, GameMode, StageTheme } from './types';

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER' | 'CLEAR'>('MENU');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [stageTheme, setStageTheme] = useState<StageTheme>('normal');

  const handleGameOver = (result: GameResult) => {
    setGameResult(result);
    setGameState('GAME_OVER');
  };

  const handleGameClear = (result: GameResult) => {
    setGameResult(result);
    setGameState('CLEAR');
  };

  const handleStart = (mode: GameMode, theme: StageTheme) => {
    setGameMode(mode);
    setStageTheme(theme);
    setGameState('PLAYING');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans text-zinc-100 p-4 overflow-hidden touch-none select-none">
      {gameState === 'MENU' && (
        <TitleScene onGameStart={handleStart} />
      )}

      {gameState === 'PLAYING' && (
        <div className="relative flex flex-col items-center w-full max-w-4xl">
          <GameCanvas
            onGameOver={handleGameOver}
            onGameClear={handleGameClear}
            gameMode={gameMode}
            stageTheme={stageTheme}
          />
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/60 to-black flex flex-col items-center justify-center z-50 gap-6">
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
          <p className="text-zinc-400 text-xl">タルトを持たずに倒れてしまった...</p>

          {gameResult && (
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl px-8 py-4 flex gap-10 text-center">
              <div>
                <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">タルト</div>
                <div className="text-yellow-400 text-3xl font-black">{gameResult.rings}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">TIME</div>
                <div className="text-blue-400 text-3xl font-black">{formatTime(gameResult.timeSeconds)}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">SCORE</div>
                <div className="text-white text-3xl font-black">{gameResult.score.toLocaleString()}</div>
              </div>
              {gameResult.distance !== undefined && (
                <div>
                  <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">DISTANCE</div>
                  <div className="text-green-400 text-3xl font-black">{gameResult.distance.toLocaleString()}m</div>
                </div>
              )}
            </div>
          )}

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
            result={gameResult}
            onRetry={() => setGameState('PLAYING')}
            onMenu={() => setGameState('MENU')}
          />
        </div>
      )}
    </div>
  );
}

export default App;
