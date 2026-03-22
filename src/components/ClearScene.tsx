import React, { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; life: number; maxLife: number;
  type: 'star' | 'circle'; angle: number; spin: number;
}

interface ClearSceneProps {
  onRetry: () => void;
  onMenu: () => void;
}

const COLORS = ['#FFD700', '#FFF176', '#FFAB40', '#FFFFFF', '#60CDFF', '#FF80AB', '#69FF47', '#FCD34D'];

export const ClearScene: React.FC<ClearSceneProps> = ({ onRetry, onMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Particle[] = [];
    let animId: number;
    let isActive = true;
    let time = 0;

    const spawnBurst = (originX?: number) => {
      const ox = originX ?? canvas.width * (0.15 + Math.random() * 0.7);
      const oy = canvas.height * 0.55;
      for (let i = 0; i < 22; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
        const speed = 2 + Math.random() * 8;
        particles.push({
          x: ox, y: oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 3 + Math.random() * 9,
          life: 70 + Math.random() * 90,
          maxLife: 160,
          type: Math.random() > 0.55 ? 'circle' : 'star',
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.25,
        });
      }
    };

    const drawStar = (size: number) => {
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
        const ia = ((j * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        if (j === 0) ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size);
        else ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
        ctx.lineTo(Math.cos(ia) * size * 0.42, Math.sin(ia) * size * 0.42);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Initial triple burst
    spawnBurst(canvas.width * 0.3);
    spawnBurst(canvas.width * 0.5);
    spawnBurst(canvas.width * 0.7);

    const loop = () => {
      if (!isActive) return;
      animId = requestAnimationFrame(loop);
      time++;

      if (time % 22 === 0) spawnBurst();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.13;
        p.angle += p.spin;
        p.life--;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        const fadeIn = Math.min(1, p.life / (p.maxLife * 0.15));
        const fadeOut = p.life / p.maxLife;
        ctx.globalAlpha = fadeIn * fadeOut;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          drawStar(p.size);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    };

    animId = requestAnimationFrame(loop);
    return () => { isActive = false; cancelAnimationFrame(animId); };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <div className="relative z-10 text-center space-y-6 px-4">
        <div>
          <h1
            className="text-6xl md:text-8xl font-black tracking-widest italic"
            style={{
              color: '#FCD34D',
              textShadow: '0 0 20px #FBBF24, 0 0 50px #F59E0B, 0 0 90px #D97706, 5px 5px 0 #78350F',
            }}
          >
            STAGE CLEAR!
          </h1>
          <p className="text-zinc-300 text-lg mt-3">見事ゴールに到達した！</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetry}
            className="px-8 py-4 bg-zinc-800/90 hover:bg-zinc-700 text-white rounded-full font-bold text-lg border border-zinc-600 transition-all hover:scale-105 flex items-center gap-2 justify-center backdrop-blur-sm"
          >
            <RefreshCw size={20} /> 同じステージでもう一度
          </button>
          <button
            onClick={onMenu}
            className="px-8 py-4 bg-blue-600/90 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-900/50 flex items-center gap-2 justify-center backdrop-blur-sm"
            style={{ textShadow: '2px 2px 0 #1E3A5F' }}
          >
            新しいステージへ
          </button>
        </div>
      </div>
    </div>
  );
};
