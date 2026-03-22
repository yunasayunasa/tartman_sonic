import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Play, RefreshCw } from 'lucide-react';

function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER' | 'CLEAR'>('MENU');

  const startGame = () => {
    setGameState('PLAYING');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans text-zinc-100 p-4 overflow-hidden touch-none select-none">
      {gameState === 'MENU' && (
        <div className="text-center space-y-8 max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-widest text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] italic">
            タルトマン 2Dアクション
          </h1>
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 text-left space-y-4">
            <p className="text-zinc-300 leading-relaxed">
              ハイスピードで駆け抜けろ！リング（<span className="text-yellow-400 font-bold">黄色</span>）を集めながら、ゴールを目指す2D横スクロールアクション。
              敵（<span className="text-red-500 font-bold">赤色</span>）は上から踏みつけて倒せるぞ！
            </p>
            <ul className="text-sm text-zinc-500 list-disc list-inside">
              <li>移動: 左右矢印キー または A, D</li>
              <li>ジャンプ: 上矢印キー または W, スペースキー</li>
              <li>スピンダッシュ（ローリング）: 走りながら 下矢印キー または S</li>
              <li>プレイヤー: <span className="text-blue-500 font-bold">青い四角</span> (ジャンプ・回転時は丸になります)</li>
              <li>背景: ドット絵のジェネレート背景</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mx-auto">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Play size={24} fill="currentColor" />
              ゲームスタート
            </button>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="relative flex flex-col items-center w-full max-w-4xl">
          <GameCanvas
            onGameOver={() => setGameState('GAME_OVER')}
            onGameClear={() => setGameState('CLEAR')}
          />
          <div className="absolute top-4 right-4 text-white/50 text-sm pointer-events-none bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm hidden md:block">
            WASD/Arrows to move & jump
          </div>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="text-center space-y-8 absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <h1 className="text-6xl md:text-8xl font-black text-red-600 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
            GAME OVER
          </h1>
          <p className="text-zinc-400 text-xl">リングを持たずに敵にぶつかってしまった...</p>
          <button
            onClick={() => setGameState('PLAYING')}
            className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold text-xl transition-all flex items-center gap-2 border border-zinc-700 hover:border-zinc-500"
          >
            <RefreshCw size={24} />
            リトライ
          </button>
        </div>
      )}

      {gameState === 'CLEAR' && (
        <div className="text-center space-y-8 absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <h1 className="text-6xl md:text-8xl font-black text-yellow-500 tracking-widest drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] italic">
            STAGE CLEAR!
          </h1>
          <p className="text-xl text-zinc-300">見事ゴールに到達した！</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold text-lg transition-all border border-zinc-700"
            >
              同じステージでもう一度
            </button>
            <button
              onClick={() => {
                setStageImage(null);
                setGameState('MENU');
              }}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-900/20"
            >
              新しいステージを生成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
