import React, { useEffect, useRef } from 'react';
import { soundManager } from '../utils/SoundManager';

interface GameCanvasProps {
  onGameOver: () => void;
  onGameClear: () => void;
}

const generatePixelBackground = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sky gradient
  for (let y = 0; y < 180; y += 4) {
    const ratio = y / 180;
    const r = Math.floor(74 + (135 - 74) * ratio);
    const g = Math.floor(144 + (206 - 144) * ratio);
    const b = Math.floor(226 + (235 - 226) * ratio);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, 320, 4);
  }

  // Clouds
  ctx.fillStyle = '#ffffff';
  const drawCloud = (cx: number, cy: number, w: number) => {
    for (let x = cx; x < cx + w; x += 4) {
      const h = Math.abs(Math.sin((x - cx) / w * Math.PI)) * 16;
      ctx.fillRect(x, cy - h, 4, h * 2);
    }
  };
  drawCloud(20, 40, 60);
  drawCloud(150, 60, 80);
  drawCloud(260, 30, 50);
  drawCloud(330, 50, 70);

  // Distant Mountains
  ctx.fillStyle = '#5c7a99';
  for (let i = 0; i < 320; i += 4) {
    const h = Math.max(0, Math.sin(i * 0.02) * 30 + Math.sin(i * 0.05) * 15 + 40);
    ctx.fillRect(i, 180 - h, 4, h);
  }
  
  // Foreground Mountains
  ctx.fillStyle = '#3b5977';
  for (let i = 0; i < 320; i += 4) {
    const h = Math.max(0, Math.sin(i * 0.03 + 1) * 25 + Math.sin(i * 0.07) * 10 + 20);
    ctx.fillRect(i, 180 - h, 4, h);
  }

  return canvas;
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, onGameClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const callbacksRef = useRef({ onGameOver, onGameClear });

  useEffect(() => {
    callbacksRef.current = { onGameOver, onGameClear };
  }, [onGameOver, onGameClear]);

  useEffect(() => {
    let isActive = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgCanvas = generatePixelBackground();

    // Load GitHub assets
    const playerImg = new Image();
    playerImg.crossOrigin = "anonymous";
    playerImg.src = 'https://raw.githubusercontent.com/yunasayunasa/tartmanyomawari/main/assets/images/tartman_run.png';
    const enemyImg = new Image();
    enemyImg.crossOrigin = "anonymous";
    enemyImg.src = 'https://raw.githubusercontent.com/yunasayunasa/tartmanyomawari/main/assets/images/slime_normal.png';
    const platformImg = new Image();
    platformImg.crossOrigin = "anonymous";
    platformImg.src = 'https://raw.githubusercontent.com/yunasayunasa/tartmanyomawari/main/assets/images/maptile_wood_02.png';
    const ringImg = new Image();
    ringImg.crossOrigin = "anonymous";
    ringImg.src = 'https://raw.githubusercontent.com/yunasayunasa/tartmanyomawari/main/assets/images/hihi.png';

    let animationFrameId: number;

    const generateLevel = (targetWidth: number) => {
      const groundPoints: {x: number, y: number}[] = [{ x: 0, y: 500 }];
      const loops: {x: number, y: number, radius: number}[] = [];
      const springs: {x: number, y: number, width: number, height: number, power: number}[] = [];
      const enemies: {x: number, y: number, width: number, height: number, vx: number, isDead: boolean, startX: number}[] = [];
      const rings: {x: number, y: number, radius: number, collected: boolean}[] = [];
      const dashPanels: {x: number, y: number, width: number, height: number, direction: number}[] = [];
      const spikes: {x: number, y: number, width: number, height: number}[] = [];
      const platforms: {x: number, y: number, width: number, height: number}[] = [];

      let cx = 0;
      let cy = 500;

      const addPoints = (pts: {x: number, y: number}[]) => {
        pts.forEach(p => groundPoints.push(p));
        cx = groundPoints[groundPoints.length - 1].x;
        cy = groundPoints[groundPoints.length - 1].y;
      };

      const makeFlat = (len: number) => {
        addPoints([{ x: cx + len, y: cy }]);
      };

      const makeHill = (len: number, height: number) => {
        const pts = [];
        for (let i = 20; i <= len; i += 20) {
          const progress = i / len;
          const yOffset = Math.sin(progress * Math.PI) * height;
          pts.push({ x: cx + i, y: cy - yOffset });
        }
        addPoints(pts);
      };

      const makeValley = (len: number, depth: number) => {
        const pts = [];
        for (let i = 20; i <= len; i += 20) {
          const progress = i / len;
          const yOffset = Math.sin(progress * Math.PI) * depth;
          pts.push({ x: cx + i, y: cy + yOffset });
        }
        addPoints(pts);
      };

      const makeRampUp = (len: number, height: number) => {
        const pts = [];
        for (let i = 20; i <= len; i += 20) {
          const progress = i / len;
          const smooth = progress * progress * (3 - 2 * progress);
          pts.push({ x: cx + i, y: cy - smooth * height });
        }
        addPoints(pts);
      };

      const makeRampDown = (len: number, height: number) => {
        const pts = [];
        for (let i = 20; i <= len; i += 20) {
          const progress = i / len;
          const smooth = progress * progress * (3 - 2 * progress);
          pts.push({ x: cx + i, y: cy + smooth * height });
        }
        addPoints(pts);
      };

      const makeGap = (len: number) => {
        addPoints([
          { x: cx, y: 2000 },
          { x: cx + len, y: 2000 },
          { x: cx + len, y: cy }
        ]);
      };

      // Start safe
      makeFlat(800);

      while (cx < targetWidth) {
        const r = Math.random();
        if (r < 0.15) {
          // Enemy horde
          makeFlat(1000);
          for (let i=0; i<12; i++) {
              enemies.push({ x: cx - 800 + i * 60, y: cy - 32, width: 32, height: 32, vx: -2, isDead: false, startX: cx - 800 + i * 60 });
          }
        } else if (r < 0.30) {
          // Upper route
          const len = 1200;
          makeFlat(len);
          for (let i=0; i<5; i++) {
              platforms.push({ x: cx - len + i * 220 + 100, y: cy - 120 - (i%2)*40, width: 120, height: 20 });
              rings.push({ x: cx - len + i * 220 + 160, y: cy - 160 - (i%2)*40, radius: 10, collected: false });
          }
        } else if (r < 0.45) {
          // Big Jump Gimmick
          makeFlat(400);
          loops.push({ x: cx, y: cy - 120, radius: 120 });
          makeFlat(400);
          dashPanels.push({ x: cx - 100, y: cy - 10, width: 40, height: 10, direction: 1 });
          loops.push({ x: cx, y: cy - 120, radius: 120 });
          makeFlat(400);
          dashPanels.push({ x: cx - 100, y: cy - 10, width: 40, height: 10, direction: 1 });
          springs.push({ x: cx - 60, y: cy - 20, width: 32, height: 20, power: -22 }); // Launchpad before big gap
          makeGap(700); // Big gap (crossable with spring + double jump)
          makeFlat(400);
        } else if (r < 0.55) {
          // Hill with rings and maybe enemy
          const len = 600 + Math.random() * 400;
          const height = 100 + Math.random() * 150;
          for(let i=1; i<=5; i++) {
             const rx = cx + (len/6)*i;
             const ry = cy - Math.sin((i/6)*Math.PI)*height - 40;
             rings.push({ x: rx, y: ry, radius: 10, collected: false });
          }
          if (Math.random() > 0.5) {
             enemies.push({ x: cx + len / 2, y: cy - height - 32, width: 32, height: 32, vx: -2, isDead: false, startX: cx + len / 2 });
          }
          makeHill(len, height);
        } else if (r < 0.65) {
          // Valley with spring
          const len = 600;
          const depth = 150;
          makeValley(len, depth);
          springs.push({ x: cx - len/2 - 16, y: cy + depth - 20, width: 32, height: 20, power: -22 });
        } else if (r < 0.75) {
          // Ramp up
          makeRampUp(500, 200);
          const panelX = cx - 100;
          // Calculate exact ground Y at panelX
          const progress = 400 / 500;
          const smooth = progress * progress * (3 - 2 * progress);
          const panelY = (cy + 200) - smooth * 200; // cy is already updated to cy - 200
          dashPanels.push({ x: panelX, y: panelY - 10, width: 40, height: 10, direction: 1 });
          makeFlat(200);
        } else if (r < 0.85) {
          // Ramp down
          makeRampDown(500, 200);
          makeFlat(200);
        } else if (r < 0.95) {
          // Gap with spring before it
          makeFlat(200);
          springs.push({ x: cx - 50, y: cy - 20, width: 32, height: 20, power: -18 });
          makeGap(300 + Math.random() * 200);
          makeFlat(200);
        } else {
          // Spikes
          makeFlat(300);
          spikes.push({ x: cx - 150, y: cy - 32, width: 64, height: 32 });
          makeFlat(300);
        }
      }

      // End area
      makeFlat(1000);

      return { groundPoints, loops, springs, enemies, rings, dashPanels, spikes, platforms, levelWidth: cx };
    };

    const level = generateLevel(15000);
    const LEVEL_WIDTH = level.levelWidth;
    const { groundPoints, loops, springs, enemies, rings, dashPanels, spikes, platforms } = level;
    const particles: {x: number, y: number, vx: number, vy: number, life: number, maxLife: number, size: number}[] = [];

    const getGroundY = (x: number) => {
      if (x <= groundPoints[0].x) return groundPoints[0].y;
      if (x >= groundPoints[groundPoints.length - 1].x) return groundPoints[groundPoints.length - 1].y;
      
      let left = 0;
      let right = groundPoints.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (groundPoints[mid].x <= x && (mid === groundPoints.length - 1 || groundPoints[mid + 1].x > x)) {
          const p1 = groundPoints[mid];
          const p2 = groundPoints[mid + 1];
          if (!p2) return p1.y;
          const t = (x - p1.x) / (p2.x - p1.x);
          return p1.y + t * (p2.y - p1.y);
        }
        if (groundPoints[mid].x > x) right = mid - 1;
        else left = mid + 1;
      }
      return 500;
    };

    const player = {
      x: 100,
      y: 100,
      width: 48,
      height: 48,
      vx: 0,
      vy: 0,
      speed: 0.2,
      maxSpeed: 15,
      friction: 0.9,
      jumpPower: -14,
      gravity: 0.6,
      isGrounded: false,
      isRolling: false,
      isSpindashing: false,
      spindashCharge: 0,
      spindashTimer: 0,
      invincibleTimer: 0,
      facingRight: true,
      isLooping: false,
      loopProgress: 0,
      loopCenterX: 0,
      loopCenterY: 0,
      loopRadius: 0,
      loopDirection: 1,
      angle: 0,
      spinAngle: 0,
      rings: 0,
      frameX: 0,
      tick: 0,
      jumpsRemaining: 2
    };

    const keys = keysRef.current;
    let prevKeys: { [key: string]: boolean } = {};

    let isGameOver = false;

    const handleKeyDown = (e: KeyboardEvent) => { 
      keys[e.key] = true; 
      soundManager.init();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', () => soundManager.init());

    const update = () => {
      if (isGameOver) return;

      if (!Number.isFinite(player.x)) player.x = 100;
      if (!Number.isFinite(player.y)) player.y = 400;
      if (!Number.isFinite(player.vx)) player.vx = 0;
      if (!Number.isFinite(player.vy)) player.vy = 0;
      if (!Number.isFinite(player.angle)) player.angle = 0;

      if (player.invincibleTimer > 0) {
        player.invincibleTimer--;
      }

      // Particles Update
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Spawn Particles when running fast
      if (player.isGrounded && Math.abs(player.vx) > 5 && !player.isRolling) {
        if (Math.random() < 0.5) {
          particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            vx: -player.vx * 0.2 + (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3,
            life: 20 + Math.random() * 10,
            maxLife: 30,
            size: 4 + Math.random() * 4
          });
        }
      }

      // Player Animation Tick
      if (player.vx !== 0) {
        player.facingRight = player.vx > 0;
        if (player.isGrounded && !player.isRolling && !player.isSpindashing) {
          player.tick++;
          if (player.tick > 5) {
            player.frameX++;
            player.tick = 0;
          }
        }
      } else {
        player.frameX = 0;
      }

      const isRight = keys['ArrowRight'] || keys['d'] || keys['rightButton'];
      const isLeft = keys['ArrowLeft'] || keys['a'] || keys['leftButton'];
      const isDown = keys['ArrowDown'] || keys['s'] || keys['spinButton'];
      const isUp = keys['ArrowUp'] || keys['w'] || keys[' '] || keys['jumpButton'];

      const jumpPressedThisFrame = isUp && !prevKeys['jump'];

      if (!player.isLooping) {
        // Spindash logic (Hold down to charge over time)
        if (isDown && player.isGrounded && Math.abs(player.vx) < 1) {
          player.isSpindashing = true;
          player.isRolling = true;
          player.vx = 0;
          player.spindashTimer++;
          if (player.spindashTimer > 15) {
            if (player.spindashCharge < 3) {
              player.spindashCharge++;
              soundManager.playCharge(player.spindashCharge);
            }
            player.spindashTimer = 0;
          }
        } else if (player.isSpindashing && !isDown) {
          player.isSpindashing = false;
          player.isRolling = true;
          if (player.spindashCharge > 0) {
            player.vx = (15 + player.spindashCharge * 10) * (player.facingRight ? 1 : -1);
            soundManager.playDash();
          }
          player.spindashCharge = 0;
          player.spindashTimer = 0;
        }

        // Rolling logic
        if (!player.isSpindashing) {
          if (isDown && player.isGrounded && Math.abs(player.vx) > 3) {
            player.isRolling = true;
          } else if (Math.abs(player.vx) < 0.5) {
            player.isRolling = false;
          }
        }

        // Horizontal movement (Acceleration)
        if (!player.isRolling && !player.isSpindashing) {
          if (isLeft) {
            player.vx -= player.speed;
            player.facingRight = false;
          } else if (isRight) {
            player.vx += player.speed;
            player.facingRight = true;
          } else {
            // Friction
            player.vx *= player.friction;
          }
        } else if (!player.isSpindashing) {
          // Rolling friction
          player.vx *= 0.98;
        }

        // Cap speed (absolute max)
        if (!player.isRolling && !player.isSpindashing) {
          if (player.vx > 8) player.vx = Math.max(8, player.vx * 0.95);
          if (player.vx < -8) player.vx = Math.min(-8, player.vx * 0.95);
        } else {
          if (player.vx > player.maxSpeed) player.vx = Math.max(player.maxSpeed, player.vx * 0.98);
          if (player.vx < -player.maxSpeed) player.vx = Math.min(-player.maxSpeed, player.vx * 0.98);
        }

        // Floor collision
        const newPlayerCenterX = player.x + player.width / 2;
        let groundY = getGroundY(newPlayerCenterX);
        let slopeAngle = 0;

        // Calculate slope angle only if on ground, not platform
        const slopeY1 = getGroundY(newPlayerCenterX - 5);
        const slopeY2 = getGroundY(newPlayerCenterX + 5);
        slopeAngle = Math.atan2(slopeY2 - slopeY1, 10);

        platforms.forEach(plat => {
          if (player.x + player.width > plat.x && player.x < plat.x + plat.width) {
            // If falling and was above platform
            if (player.vy >= 0 && player.y + player.height - player.vy <= plat.y + 20) {
              if (plat.y < groundY) {
                groundY = plat.y;
                slopeAngle = 0; // Platforms are flat
              }
            }
          }
        });

        // Jump (supports double jump)
        if (jumpPressedThisFrame && player.jumpsRemaining > 0 && !player.isSpindashing) {
          if (player.isGrounded) {
            player.vy = player.jumpPower * Math.cos(slopeAngle);
            player.vx -= player.jumpPower * Math.sin(slopeAngle);
          } else {
            // Second jump — straight up, no slope correction
            player.vy = player.jumpPower * 0.85;
          }
          player.isGrounded = false;
          player.isRolling = false;
          player.jumpsRemaining--;
          soundManager.playJump();
        }

        // Gravity
        if (!player.isGrounded) {
          player.vy += player.gravity;
        }

        // Update position
        player.x += player.vx;
        player.y += player.vy;

        // Floor collision (re-calculate after movement)
        const finalPlayerCenterX = player.x + player.width / 2;
        let finalGroundY = getGroundY(finalPlayerCenterX);
        let finalSlopeAngle = 0;

        const finalSlopeY1 = getGroundY(finalPlayerCenterX - 5);
        const finalSlopeY2 = getGroundY(finalPlayerCenterX + 5);
        finalSlopeAngle = Math.atan2(finalSlopeY2 - finalSlopeY1, 10);

        platforms.forEach(plat => {
          if (player.x + player.width > plat.x && player.x < plat.x + plat.width) {
            if (player.vy >= 0 && player.y + player.height - player.vy <= plat.y + 20) {
              if (plat.y < finalGroundY) {
                finalGroundY = plat.y;
                finalSlopeAngle = 0;
              }
            }
          }
        });

        if (player.isGrounded) {
          // Fall off if gap
          if (finalGroundY > 1500) {
            player.isGrounded = false;
          } else {
            // Slope gravity
            player.vx += Math.sin(finalSlopeAngle) * 0.8;
            
            // Stick to ground
            player.y = finalGroundY - player.height;
            player.vy = 0;
            player.angle = finalSlopeAngle;
            player.jumpsRemaining = 2; // Reset double jump while grounded
          }
        } else {
          player.angle = 0;
          if (player.vy >= 0 && player.y + player.height >= finalGroundY && finalGroundY < 1500) {
            if (player.y + player.height - player.vy <= finalGroundY + 20) {
              player.y = finalGroundY - player.height;
              player.vy = 0;
              player.isGrounded = true;
              player.jumpsRemaining = 2; // Reset double jump on landing
              player.isRolling = false;
            } else {
              // Hit a wall, stop horizontal movement
              player.vx = 0;
            }
          }
        }

        // Spring collision
        springs.forEach(spring => {
          if (
            player.x < spring.x + spring.width &&
            player.x + player.width > spring.x &&
            player.y + player.height >= spring.y &&
            player.y + player.height <= spring.y + 20 &&
            player.vy >= 0
          ) {
            player.vy = spring.power;
            player.isGrounded = false;
            player.isRolling = false;
            player.isSpindashing = false;
            soundManager.playSpring();
          }
        });

        // Loop entry
        loops.forEach(loop => {
          const distX = (player.x + player.width / 2) - loop.x;
          if (player.isGrounded && Math.abs(distX) < 15 && Math.abs((player.y + player.height) - (loop.y + loop.radius)) < 20) {
            if (Math.abs(player.vx) >= 7.5) {
              player.isLooping = true;
              player.loopCenterX = loop.x;
              player.loopCenterY = loop.y;
              player.loopRadius = loop.radius;
              player.loopDirection = player.vx > 0 ? 1 : -1;
              player.loopProgress = Math.PI / 2; // Bottom
            }
          }
        });

        // Dash Panels
        dashPanels.forEach(panel => {
          if (player.x < panel.x + panel.width && player.x + player.width > panel.x &&
              player.y + player.height >= panel.y - 10 && player.y <= panel.y + panel.height) {
            if (Math.abs(player.vx) < 25) {
              soundManager.playDash();
            }
            player.vx = 25 * panel.direction;
            player.facingRight = panel.direction === 1;
            player.isRolling = true;
          }
        });

        // Spikes
        spikes.forEach(spike => {
          if (player.x < spike.x + spike.width && player.x + player.width > spike.x &&
              player.y + player.height >= spike.y && player.y <= spike.y + spike.height) {
            if (player.invincibleTimer <= 0) {
              if (player.rings > 0) {
                player.rings = 0;
                player.vy = -8;
                player.vx = player.vx > 0 ? -6 : 6;
                player.isRolling = false;
                player.invincibleTimer = 120;
                soundManager.playDamage();
              } else {
                isGameOver = true;
                callbacksRef.current.onGameOver();
              }
            }
          }
        });
      } else {
        // Loop physics
        const speed = Math.max(Math.abs(player.vx), 8);
        player.loopProgress += (speed / player.loopRadius) * (player.loopDirection === 1 ? -1 : 1);
        
        player.x = player.loopCenterX + Math.cos(player.loopProgress) * player.loopRadius - player.width / 2;
        player.y = player.loopCenterY + Math.sin(player.loopProgress) * player.loopRadius - player.height / 2;
        
        player.vy = 0;
        player.isGrounded = false;
        player.isRolling = true;

        // Exit loop
        if (player.loopDirection === 1 && player.loopProgress <= -3 * Math.PI / 2) {
           player.isLooping = false;
           player.x = player.loopCenterX + 16; // Push past entry threshold
           player.y = getGroundY(player.x + player.width / 2) - player.height;
           player.isGrounded = true;
           player.vx = speed + 10;
        } else if (player.loopDirection === -1 && player.loopProgress >= 5 * Math.PI / 2) {
           player.isLooping = false;
           player.x = player.loopCenterX - 16 - player.width; // Push past entry threshold
           player.y = getGroundY(player.x + player.width / 2) - player.height;
           player.isGrounded = true;
           player.vx = -(speed + 10);
        }
      }

      // Left boundary
      if (player.x < 0) {
        player.x = 0;
        player.vx = 0;
      }

      // Fall death condition
      if (player.y > 1800) {
        isGameOver = true;
        callbacksRef.current.onGameOver();
      }

      // Goal condition
      if (player.x > LEVEL_WIDTH - 100) {
        isGameOver = true;
        callbacksRef.current.onGameClear();
      }

      // Rings collision
      rings.forEach(ring => {
        if (!ring.collected) {
          const distX = (player.x + player.width / 2) - ring.x;
          const distY = (player.y + player.height / 2) - ring.y;
          const distance = Math.sqrt(distX * distX + distY * distY);
          if (distance < player.width / 2 + ring.radius) {
            ring.collected = true;
            player.rings++;
            soundManager.playRing();
          }
        }
      });

      // Enemies update & collision
      enemies.forEach(enemy => {
        if (enemy.isDead) return;

        enemy.x += enemy.vx;
        enemy.y = getGroundY(enemy.x + enemy.width / 2) - enemy.height;
        if (Math.abs(enemy.x - enemy.startX) > 100) {
          enemy.vx *= -1;
        }

        if (
          player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y
        ) {
          const isSpinning = !player.isGrounded || player.isRolling || player.isSpindashing || player.isLooping;
          if (isSpinning) {
            enemy.isDead = true;
            soundManager.playDamage(); // Pop sound for enemy
            if (!player.isGrounded && !player.isLooping) {
              player.vy = player.jumpPower * 0.8;
            }
          } else if (player.invincibleTimer <= 0) {
            if (player.rings > 0) {
              player.rings = 0;
              player.vy = -8;
              player.vx = player.vx > 0 ? -6 : 6;
              player.isRolling = false;
              player.invincibleTimer = 120;
              soundManager.playDamage();
            } else {
              isGameOver = true;
              callbacksRef.current.onGameOver();
            }
          }
        }
      });

      prevKeys = { ...keys, jump: isUp };
    };

    const draw = () => {
      // Camera follows player (Zoomed in)
      const zoom = 1.5;
      let cameraX = player.x - (canvas.width / zoom) / 3;
      if (cameraX < 0) cameraX = 0;
      if (cameraX > LEVEL_WIDTH - (canvas.width / zoom)) cameraX = LEVEL_WIDTH - (canvas.width / zoom);

      let cameraY = player.y - (canvas.height / zoom) / 2 + 50;
      // Prevent camera from going too high above the level
      if (cameraY < -1000) cameraY = -1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#87CEEB'; // Sky blue fallback
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(zoom, zoom);

      // Draw Parallax Background
      ctx.imageSmoothingEnabled = false; // Pixel art scaling
      const bgWidth = canvas.width / zoom;
      const bgHeight = canvas.height / zoom;
      let parallaxX = (cameraX * 0.2) % bgWidth;
      if (parallaxX < 0) parallaxX += bgWidth;
      
      ctx.drawImage(bgCanvas, -parallaxX - bgWidth, 0, bgWidth, bgHeight);
      ctx.drawImage(bgCanvas, -parallaxX, 0, bgWidth, bgHeight);
      ctx.drawImage(bgCanvas, -parallaxX + bgWidth, 0, bgWidth, bgHeight);
      ctx.drawImage(bgCanvas, -parallaxX + bgWidth * 2, 0, bgWidth, bgHeight);
      ctx.imageSmoothingEnabled = true;

      ctx.save();
      ctx.translate(-cameraX, -cameraY);

      // Draw Heightmap Floor
      ctx.beginPath();
      ctx.moveTo(groundPoints[0].x, cameraY + canvas.height + 1000);
      for (let i = 0; i < groundPoints.length; i++) {
        ctx.lineTo(groundPoints[i].x, groundPoints[i].y);
      }
      ctx.lineTo(groundPoints[groundPoints.length - 1].x, cameraY + canvas.height + 1000);
      ctx.closePath();
      
      ctx.fillStyle = '#8B4513'; // Dirt
      ctx.fill();
      
      ctx.beginPath();
      for (let i = 0; i < groundPoints.length; i++) {
        if (i === 0) ctx.moveTo(groundPoints[i].x, groundPoints[i].y);
        else ctx.lineTo(groundPoints[i].x, groundPoints[i].y);
      }
      ctx.strokeStyle = '#228B22'; // Grass
      ctx.lineWidth = 16;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw Platforms
      platforms.forEach(plat => {
        if (platformImg.complete && platformImg.naturalWidth > 0) {
          // Draw repeating pattern or stretched image
          ctx.drawImage(platformImg, plat.x, plat.y, plat.width, plat.height);
        } else {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#228B22';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
        }
      });

      // Draw Goal
      const goalX = LEVEL_WIDTH - 150;
      const goalY = getGroundY(goalX);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(goalX, goalY - 200, 20, 200);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(goalX, goalY - 200, 80, 40);

      // Draw Dash Panels
      dashPanels.forEach(panel => {
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        if (panel.direction === 1) {
          ctx.moveTo(panel.x + 5, panel.y + 5);
          ctx.lineTo(panel.x + 25, panel.y + 5);
          ctx.lineTo(panel.x + 15, panel.y - 5);
        } else {
          ctx.moveTo(panel.x + panel.width - 5, panel.y + 5);
          ctx.lineTo(panel.x + panel.width - 25, panel.y + 5);
          ctx.lineTo(panel.x + panel.width - 15, panel.y - 5);
        }
        ctx.fill();
      });

      // Draw Spikes
      spikes.forEach(spike => {
        ctx.fillStyle = '#A9A9A9';
        for(let i=0; i<spike.width; i+=16) {
          ctx.beginPath();
          ctx.moveTo(spike.x + i, spike.y + spike.height);
          ctx.lineTo(spike.x + i + 8, spike.y);
          ctx.lineTo(spike.x + i + 16, spike.y + spike.height);
          ctx.fill();
        }
      });

      // Draw Rings
      rings.forEach(ring => {
        if (!ring.collected) {
          if (ringImg.complete && ringImg.naturalWidth > 0) {
            ctx.drawImage(ringImg, ring.x - ring.radius * 1.5, ring.y - ring.radius * 1.5, ring.radius * 3, ring.radius * 3);
          } else {
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = '#FFF8DC';
            ctx.fill();
          }
        }
      });

      // Draw Springs
      springs.forEach(spring => {
        ctx.fillStyle = '#FF8C00'; // Orange spring base
        ctx.fillRect(spring.x, spring.y + 10, spring.width, 10);
        ctx.fillStyle = '#FF0000'; // Red spring top
        ctx.fillRect(spring.x, spring.y, spring.width, 10);
      });

      // Draw Loops
      loops.forEach(loop => {
        ctx.beginPath();
        ctx.arc(loop.x, loop.y, loop.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 20;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(loop.x, loop.y, loop.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 10;
        ctx.stroke();
      });

      // Draw Enemies
      enemies.forEach(enemy => {
        if (!enemy.isDead) {
          if (enemyImg.complete && enemyImg.naturalWidth > 0) {
            const frames = Math.max(1, Math.floor(enemyImg.naturalWidth / enemyImg.naturalHeight));
            const frameWidth = enemyImg.naturalWidth / frames;
            const currentFrame = Math.floor(Date.now() / 200) % frames;

            ctx.save();
            if (enemy.vx > 0) {
              // Flip horizontally if moving right
              ctx.translate(enemy.x + enemy.width, enemy.y);
              ctx.scale(-1, 1);
              ctx.drawImage(
                enemyImg,
                currentFrame * frameWidth, 0, frameWidth, enemyImg.naturalHeight,
                0, 0, enemy.width, enemy.height
              );
            } else {
              ctx.drawImage(
                enemyImg,
                currentFrame * frameWidth, 0, frameWidth, enemyImg.naturalHeight,
                enemy.x, enemy.y, enemy.width, enemy.height
              );
            }
            ctx.restore();
          } else {
            ctx.fillStyle = '#FF0000'; // Red badniks
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(enemy.x + (enemy.vx > 0 ? 20 : 4), enemy.y + 8, 8, 8);
            ctx.fillStyle = '#000000';
            ctx.fillRect(enemy.x + (enemy.vx > 0 ? 24 : 4), enemy.y + 10, 4, 4);
          }
        }
      });

      // Draw Particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        if (ringImg.complete && ringImg.naturalWidth > 0) {
          ctx.drawImage(ringImg, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      });

      // Draw Player (Sonic-like)
      if (player.invincibleTimer === 0 || Math.floor(Date.now() / 100) % 2 === 0) {
        const isSpinning = !player.isGrounded || player.isRolling || player.isSpindashing || player.isLooping;
        
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

        // Draw Spindash Aura
        if (player.spindashCharge > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, 24 + player.spindashCharge * 4, 0, Math.PI * 2);
          if (player.spindashCharge === 1) ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
          if (player.spindashCharge === 2) ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
          if (player.spindashCharge === 3) ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.lineWidth = 4 + player.spindashCharge * 2;
          ctx.stroke();
        }
        
        if (isSpinning) {
          player.spinAngle += (player.vx || 10) * 0.15;
          ctx.rotate(player.spinAngle);
          if (playerImg.complete && playerImg.naturalWidth > 0) {
            const frames = Math.max(1, Math.floor(playerImg.naturalWidth / playerImg.naturalHeight));
            const frameWidth = playerImg.naturalWidth / frames;
            // Use frame 0 or a specific spin frame if available
            ctx.drawImage(
              playerImg,
              0, 0, frameWidth, playerImg.naturalHeight,
              -player.width / 2, -player.height / 2, player.width, player.height
            );
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#0000FF';
            ctx.fill();
            
            ctx.strokeStyle = '#87CEFA';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-player.width / 2, 0);
            ctx.lineTo(player.width / 2, 0);
            ctx.moveTo(0, -player.height / 2);
            ctx.lineTo(0, player.height / 2);
            ctx.stroke();
          }
        } else {
          ctx.rotate(player.angle);
          if (playerImg.complete && playerImg.naturalWidth > 0) {
            if (!player.facingRight) {
              ctx.scale(-1, 1);
            }
            const frames = Math.max(1, Math.floor(playerImg.naturalWidth / playerImg.naturalHeight));
            const frameWidth = playerImg.naturalWidth / frames;
            const currentFrame = player.frameX % frames;
            
            ctx.drawImage(
              playerImg,
              currentFrame * frameWidth, 0, frameWidth, playerImg.naturalHeight,
              -player.width / 2, -player.height / 2, player.width, player.height
            );
          } else {
            ctx.fillStyle = '#0000FF';
            ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
          }
        }
        ctx.restore();
        
        if (Math.abs(player.vx) > 8 && !player.isLooping) {
          ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
          if (isSpinning) {
            if (playerImg.complete && playerImg.naturalWidth > 0) {
               ctx.save();
               ctx.translate(player.x + player.width / 2 - player.vx, player.y + player.height / 2);
               ctx.rotate(player.spinAngle);
               ctx.globalAlpha = 0.3;
               ctx.drawImage(playerImg, -player.width / 2, -player.height / 2, player.width, player.height);
               ctx.restore();
            } else {
               ctx.beginPath();
               ctx.arc(player.x + player.width / 2 - player.vx, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
               ctx.fill();
            }
          } else {
            if (playerImg.complete && playerImg.naturalWidth > 0) {
               ctx.save();
               ctx.translate(player.x + player.width / 2 - player.vx, player.y + player.height / 2);
               if (!player.facingRight) ctx.scale(-1, 1);
               ctx.globalAlpha = 0.3;
               ctx.drawImage(playerImg, -player.width / 2, -player.height / 2, player.width, player.height);
               ctx.restore();
            } else {
               ctx.fillRect(player.x - player.vx, player.y, player.width, player.height);
            }
          }
        }
      }

      // UI (Rings count)
      ctx.restore(); // Restore camera translation
      ctx.restore(); // Restore zoom scale
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`RINGS: ${player.rings}`, 20, 40);
      ctx.fillText(`RINGS: ${player.rings}`, 20, 40);
    };

    let lastTime = performance.now();
    const fpsInterval = 1000 / 60;

    const loop = (currentTime: number) => {
      if (!isActive) return;
      
      animationFrameId = requestAnimationFrame(loop);

      const elapsed = currentTime - lastTime;
      if (elapsed >= fpsInterval) {
        lastTime = currentTime - (elapsed % fpsInterval);
        
        try {
          update();
          draw();
          if (isGameOver) {
            isActive = false;
          }
        } catch (e) {
          console.error("Game loop error:", e);
          ctx.fillStyle = 'red';
          ctx.font = '20px sans-serif';
          ctx.fillText("ERROR: " + (e as Error).message, 20, 80);
          isActive = false; // Stop loop on error
        }
      }
    };

    if (playerImg.complete) {
      animationFrameId = requestAnimationFrame(loop);
    } else {
      playerImg.onload = () => { if (isActive) animationFrameId = requestAnimationFrame(loop); };
      playerImg.onerror = () => { if (isActive) animationFrameId = requestAnimationFrame(loop); };
    }

    return () => {
      isActive = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[800px] mx-auto touch-none select-none">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="bg-sky-400 rounded-xl shadow-2xl border border-zinc-800 w-full h-auto block touch-none"
      />
      
      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 flex justify-between pointer-events-none z-50 touch-none">
        
        {/* Left/Right Buttons */}
        <div className="flex gap-2 sm:gap-4 pointer-events-auto items-end">
          <button 
            className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800/80 rounded-full flex items-center justify-center text-white active:bg-zinc-700 select-none touch-manipulation shadow-lg border-2 border-white/20 text-2xl sm:text-3xl"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current['leftButton'] = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current['leftButton'] = false; }}
            onTouchCancel={(e) => { e.preventDefault(); keysRef.current['leftButton'] = false; }}
            onMouseDown={() => keysRef.current['leftButton'] = true}
            onMouseUp={() => keysRef.current['leftButton'] = false}
            onMouseLeave={() => keysRef.current['leftButton'] = false}
          >
            ◀
          </button>
          <button 
            className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800/80 rounded-full flex items-center justify-center text-white active:bg-zinc-700 select-none touch-manipulation shadow-lg border-2 border-white/20 text-2xl sm:text-3xl"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current['rightButton'] = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current['rightButton'] = false; }}
            onTouchCancel={(e) => { e.preventDefault(); keysRef.current['rightButton'] = false; }}
            onMouseDown={() => keysRef.current['rightButton'] = true}
            onMouseUp={() => keysRef.current['rightButton'] = false}
            onMouseLeave={() => keysRef.current['rightButton'] = false}
          >
            ▶
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-4 pointer-events-auto items-end">
          <button 
            className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600/90 rounded-full flex items-center justify-center text-white active:bg-red-500 select-none touch-manipulation shadow-lg shadow-red-900/50 font-bold text-lg sm:text-xl border-4 border-white/20"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current['spinButton'] = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current['spinButton'] = false; }}
            onTouchCancel={(e) => { e.preventDefault(); keysRef.current['spinButton'] = false; }}
            onMouseDown={() => keysRef.current['spinButton'] = true}
            onMouseUp={() => keysRef.current['spinButton'] = false}
            onMouseLeave={() => keysRef.current['spinButton'] = false}
          >
            SPIN
          </button>
          <button 
            className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600/90 rounded-full flex items-center justify-center text-white active:bg-blue-500 select-none touch-manipulation shadow-lg shadow-blue-900/50 font-bold text-xl sm:text-2xl border-4 border-white/20"
            onTouchStart={(e) => { e.preventDefault(); keysRef.current['jumpButton'] = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current['jumpButton'] = false; }}
            onTouchCancel={(e) => { e.preventDefault(); keysRef.current['jumpButton'] = false; }}
            onMouseDown={() => keysRef.current['jumpButton'] = true}
            onMouseUp={() => keysRef.current['jumpButton'] = false}
            onMouseLeave={() => keysRef.current['jumpButton'] = false}
          >
            JUMP
          </button>
        </div>
      </div>
    </div>
  );
};
