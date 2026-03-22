import React, { useEffect, useRef, useState } from 'react';
import type { GameMode, StageTheme } from '../types';

const generateBg = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < 180; y += 4) {
    const ratio = y / 180;
    const r = Math.floor(74 + (135 - 74) * ratio);
    const g = Math.floor(144 + (206 - 144) * ratio);
    const b = Math.floor(226 + (235 - 226) * ratio);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 320, 4);
  }
  ctx.fillStyle = '#ffffff';
  const drawCloud = (cx: number, cy: number, w: number) => {
    for (let x = cx; x < cx + w; x += 4) {
      const h = Math.abs(Math.sin((x - cx) / w * Math.PI)) * 16;
      ctx.fillRect(x, cy - h, 4, h * 2);
    }
  };
  drawCloud(20, 40, 60); drawCloud(150, 60, 80); drawCloud(260, 30, 50); drawCloud(330, 50, 70);
  ctx.fillStyle = '#5c7a99';
  for (let i = 0; i < 320; i += 4) {
    const h = Math.max(0, Math.sin(i * 0.02) * 30 + Math.sin(i * 0.05) * 15 + 40);
    ctx.fillRect(i, 180 - h, 4, h);
  }
  ctx.fillStyle = '#3b5977';
  for (let i = 0; i < 320; i += 4) {
    const h = Math.max(0, Math.sin(i * 0.03 + 1) * 25 + Math.sin(i * 0.07) * 10 + 20);
    ctx.fillRect(i, 180 - h, 4, h);
  }
  return canvas;
};

interface TitleSceneProps {
  onGameStart: (mode: GameMode, theme: StageTheme) => void;
}

const THEME_LABELS: Record<StageTheme, { label: string; color: string; desc: string }> = {
  normal: { label: '緑の丘', color: '#60A5FA', desc: '青空と緑の草原' },
  desert: { label: '砂漠', color: '#FBBF24', desc: '灼熱の砂漠地帯' },
  night: { label: '夜', color: '#818CF8', desc: '星降る夜のステージ' },
};

export const TitleScene: React.FC<TitleSceneProps> = ({ onGameStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStartingRef = useRef(false);
  const [step, setStep] = useState<'title' | 'mode' | 'theme'>('title');
  const [selectedMode, setSelectedMode] = useState<GameMode>('normal');
  const [selectedTheme, setSelectedTheme] = useState<StageTheme>('normal');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgCanvas = generateBg();
    const playerImg = new Image();
    playerImg.crossOrigin = 'anonymous';
    playerImg.src = 'https://raw.githubusercontent.com/yunasayunasa/tartmanyomawari/main/assets/images/tartman_run.png';

    let scrollX = 0;
    const GROUND_Y = canvas.height * 0.72;
    const W = 72, H = 72;
    let playerX = canvas.width * 0.25;
    let playerVx = 3;
    let frameX = 0;
    let tick = 0;
    let isActive = true;
    let animId: number;

    const loop = () => {
      if (!isActive) return;
      animId = requestAnimationFrame(loop);
      const starting = isStartingRef.current;

      scrollX += starting ? playerVx * 0.45 : 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.imageSmoothingEnabled = false;
      const bgW = canvas.width;
      const bgH = Math.ceil(180 * (canvas.width / 320));
      let bx = (scrollX * 0.5) % bgW;
      if (bx < 0) bx += bgW;
      ctx.drawImage(bgCanvas, -bx - bgW, 0, bgW, bgH);
      ctx.drawImage(bgCanvas, -bx,       0, bgW, bgH);
      ctx.drawImage(bgCanvas, -bx + bgW, 0, bgW, bgH);
      ctx.imageSmoothingEnabled = true;

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, GROUND_Y - 12, canvas.width, 12);

      if (starting) {
        playerVx = Math.min(playerVx + 0.5, 26);
        playerX += playerVx;
        if (playerX > canvas.width + W * 2) {
          isActive = false;
          onGameStart(selectedMode, selectedTheme);
          return;
        }
      } else {
        playerX += playerVx;
        if (playerX > canvas.width * 0.68) playerX = canvas.width * 0.22;
      }

      tick++;
      const frameRate = starting ? Math.max(1, 6 - Math.floor(playerVx / 4)) : 5;
      if (tick >= frameRate) { frameX++; tick = 0; }

      if (starting && playerVx > 10 && playerImg.complete && playerImg.naturalWidth > 0) {
        const frames = Math.max(1, Math.floor(playerImg.naturalWidth / playerImg.naturalHeight));
        const fw = playerImg.naturalWidth / frames;
        const cf = frameX % frames;
        for (let i = 3; i >= 1; i--) {
          ctx.save();
          ctx.translate(playerX + W / 2 - playerVx * i * 1.1, GROUND_Y - H / 2);
          ctx.globalAlpha = 0.12 / i;
          ctx.drawImage(playerImg, cf * fw, 0, fw, playerImg.naturalHeight, -W / 2, -H / 2, W, H);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(playerX + W / 2, GROUND_Y - H / 2);
      if (playerImg.complete && playerImg.naturalWidth > 0) {
        const frames = Math.max(1, Math.floor(playerImg.naturalWidth / playerImg.naturalHeight));
        const fw = playerImg.naturalWidth / frames;
        const cf = frameX % frames;
        ctx.drawImage(playerImg, cf * fw, 0, fw, playerImg.naturalHeight, -W / 2, -H / 2, W, H);
      } else {
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(-W / 2, -H / 2, W, H);
      }
      ctx.restore();
    };

    animId = requestAnimationFrame(loop);
    return () => { isActive = false; cancelAnimationFrame(animId); };
  }, [onGameStart, selectedMode, selectedTheme]);

  const handleStart = () => {
    isStartingRef.current = true;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full rounded-2xl border border-zinc-800 shadow-2xl shadow-blue-950/50 block"
      />

      {/* Title text overlay */}
      <div className="absolute inset-x-0 top-8 flex flex-col items-center pointer-events-none">
        <h1
          className="text-6xl md:text-8xl font-black tracking-widest italic select-none"
          style={{
            color: '#60A5FA',
            textShadow: '0 0 20px #3B82F6, 0 0 50px #2563EB, 4px 4px 0 #1E3A5F, -1px -1px 0 #93C5FD',
          }}
        >
          タルトラン
        </h1>
        <p
          className="text-2xl font-bold tracking-[0.35em] mt-2 select-none"
          style={{ color: '#FCD34D', textShadow: '0 0 12px #FBBF24, 2px 2px 0 #78350F' }}
        >
          ワールドソニック
        </p>
      </div>

      {/* Bottom UI */}
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-4">

        {/* STEP: title — 操作説明 + モード選択へ */}
        {step === 'title' && (
          <>
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 grid grid-cols-2 gap-x-8 gap-y-1 max-w-lg w-full">
              <span><span className="text-yellow-400 font-bold">←→ / A D</span>　移動</span>
              <span><span className="text-blue-400 font-bold">↑ / W / Space</span>　ジャンプ（2段可）</span>
              <span><span className="text-orange-400 font-bold">↓ / S</span>　スピンダッシュ</span>
              <span><span className="text-red-400 font-bold">赤い敵</span>　踏んで倒せ！</span>
            </div>
            <button
              onClick={() => setStep('mode')}
              className="pointer-events-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full font-black text-2xl transition-all shadow-xl shadow-blue-900/60 border-4 border-blue-400/30 hover:scale-105 active:scale-95"
              style={{ textShadow: '2px 2px 0 #1E3A5F' }}
            >
              ▶ ゲームスタート
            </button>
          </>
        )}

        {/* STEP: mode selection */}
        {step === 'mode' && (
          <div className="flex flex-col items-center gap-3 w-full max-w-md pointer-events-auto">
            <p className="text-zinc-300 font-bold text-lg tracking-widest">モードを選んでください</p>
            <div className="flex gap-4 w-full">
              {(['normal', 'infinite'] as GameMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setSelectedMode(mode); setStep('theme'); }}
                  className={`flex-1 py-4 rounded-2xl font-black text-xl border-2 transition-all hover:scale-105 ${
                    mode === 'normal'
                      ? 'bg-blue-700/80 border-blue-400 text-white shadow-lg shadow-blue-900/50'
                      : 'bg-purple-700/80 border-purple-400 text-white shadow-lg shadow-purple-900/50'
                  }`}
                >
                  {mode === 'normal' ? '🏁 ノーマル' : '∞ 無限ラン'}
                  <div className="text-xs font-normal mt-1 opacity-75">
                    {mode === 'normal' ? 'ゴールを目指す' : 'どこまでも走る'}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('title')} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← 戻る</button>
          </div>
        )}

        {/* STEP: theme selection */}
        {step === 'theme' && (
          <div className="flex flex-col items-center gap-3 w-full max-w-lg pointer-events-auto">
            <p className="text-zinc-300 font-bold text-lg tracking-widest">ステージを選んでください</p>
            <div className="flex gap-3 w-full">
              {(Object.keys(THEME_LABELS) as StageTheme[]).map(theme => (
                <button
                  key={theme}
                  onClick={() => { setSelectedTheme(theme); handleStart(); }}
                  className={`flex-1 py-3 rounded-2xl font-black text-base border-2 transition-all hover:scale-105`}
                  style={{
                    background: theme === 'normal' ? 'rgba(59,130,246,0.7)' : theme === 'desert' ? 'rgba(217,119,6,0.7)' : 'rgba(79,70,229,0.7)',
                    borderColor: THEME_LABELS[theme].color,
                    color: '#fff',
                    textShadow: '1px 1px 0 #000',
                  }}
                >
                  {THEME_LABELS[theme].label}
                  <div className="text-xs font-normal mt-1 opacity-80">{THEME_LABELS[theme].desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('mode')} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← 戻る</button>
          </div>
        )}
      </div>
    </div>
  );
};
