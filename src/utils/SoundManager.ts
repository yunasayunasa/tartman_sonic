export class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmNodes: AudioNode[] = [];
  private bgmActive = false;
  private bgmTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private bgmTheme: 'normal' | 'desert' | 'night' | 'boss' = 'normal';
  private muted = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopBGM();
    } else {
      // Resume BGM if it was playing
      if (this.bgmActive) {
        this.playBGM(this.bgmTheme);
      }
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  playJump() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playRing() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playSpring() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playDash() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playDamage() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playCharge(level: number) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'square';
    const baseFreq = 200 + level * 200;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 100, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playRingScatter() {
    if (this.muted || !this.ctx) return;
    const frequencies = [1318, 1109, 932, 784, 659];
    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = 'sine';
      const t = this.ctx!.currentTime + i * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  playGoal() {
    if (this.muted || !this.ctx) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = 'square';
      const t = this.ctx!.currentTime + i * 0.13;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playBGM(theme: 'normal' | 'desert' | 'night' | 'boss') {
    if (this.muted) {
      // Store the theme so if unmuted later we can resume
      this.bgmTheme = theme;
      this.bgmActive = true;
      return;
    }
    if (!this.ctx) return;
    this.stopBGM();
    this.bgmActive = true;
    this.bgmTheme = theme;
    this._scheduleBGM(this.ctx.currentTime);
  }

  stopBGM() {
    this.bgmActive = false;
    if (this.bgmTimeoutId !== null) {
      clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
    this.bgmNodes.forEach(node => {
      try {
        (node as OscillatorNode).stop?.();
        node.disconnect();
      } catch (_) { /* already stopped */ }
    });
    this.bgmNodes = [];
  }

  playBossBGM() {
    this.playBGM('boss');
  }

  private _scheduleBGM(startTime: number) {
    if (!this.bgmActive || !this.ctx) return;

    const theme = this.bgmTheme;
    const ctx = this.ctx;

    type NoteSeq = { freq: number; dur: number }[];
    let bpm = 160;
    let melodyNotes: NoteSeq = [];
    let bassNotes: NoteSeq = [];

    if (theme === 'normal') {
      bpm = 160;
      melodyNotes = [
        { freq: 523, dur: 0.25 }, { freq: 659, dur: 0.25 }, { freq: 784, dur: 0.25 }, { freq: 1047, dur: 0.25 },
        { freq: 880, dur: 0.5 },  { freq: 784, dur: 0.25 }, { freq: 659, dur: 0.25 },
        { freq: 523, dur: 0.25 }, { freq: 587, dur: 0.25 }, { freq: 659, dur: 0.5 },
        { freq: 698, dur: 0.25 }, { freq: 784, dur: 0.25 }, { freq: 698, dur: 0.25 }, { freq: 659, dur: 0.25 },
        { freq: 523, dur: 1.0 },
      ];
      bassNotes = [
        { freq: 130, dur: 0.5 }, { freq: 196, dur: 0.5 },
        { freq: 130, dur: 0.5 }, { freq: 196, dur: 0.5 },
        { freq: 110, dur: 0.5 }, { freq: 165, dur: 0.5 },
        { freq: 130, dur: 0.5 }, { freq: 196, dur: 0.5 },
      ];
    } else if (theme === 'desert') {
      bpm = 120;
      melodyNotes = [
        { freq: 440, dur: 0.5 },  { freq: 415, dur: 0.25 }, { freq: 370, dur: 0.25 },
        { freq: 330, dur: 0.5 },  { freq: 294, dur: 0.5 },
        { freq: 330, dur: 0.25 }, { freq: 370, dur: 0.25 }, { freq: 415, dur: 0.5 },
        { freq: 440, dur: 1.0 },
      ];
      bassNotes = [
        { freq: 110, dur: 0.5 }, { freq: 147, dur: 0.5 },
        { freq: 110, dur: 0.5 }, { freq: 147, dur: 0.5 },
        { freq: 98,  dur: 0.5 }, { freq: 131, dur: 0.5 },
        { freq: 110, dur: 0.5 }, { freq: 147, dur: 0.5 },
      ];
    } else if (theme === 'night') {
      bpm = 90;
      melodyNotes = [
        { freq: 277, dur: 0.5 },  { freq: 311, dur: 0.5 },
        { freq: 370, dur: 0.5 },  { freq: 311, dur: 0.5 },
        { freq: 277, dur: 0.25 }, { freq: 247, dur: 0.25 }, { freq: 220, dur: 0.5 },
        { freq: 247, dur: 0.5 },  { freq: 277, dur: 1.0 },
      ];
      bassNotes = [
        { freq: 69,  dur: 0.5 }, { freq: 93,  dur: 0.5 },
        { freq: 69,  dur: 0.5 }, { freq: 93,  dur: 0.5 },
        { freq: 62,  dur: 0.5 }, { freq: 82,  dur: 0.5 },
        { freq: 69,  dur: 0.5 }, { freq: 93,  dur: 0.5 },
      ];
    } else {
      // boss
      bpm = 180;
      melodyNotes = [
        { freq: 330, dur: 0.125 }, { freq: 330, dur: 0.125 }, { freq: 392, dur: 0.25 },
        { freq: 370, dur: 0.125 }, { freq: 330, dur: 0.125 }, { freq: 294, dur: 0.25 },
        { freq: 330, dur: 0.5 },
        { freq: 247, dur: 0.125 }, { freq: 247, dur: 0.125 }, { freq: 294, dur: 0.25 },
        { freq: 277, dur: 0.125 }, { freq: 247, dur: 0.125 }, { freq: 220, dur: 0.25 },
        { freq: 247, dur: 0.5 },
      ];
      bassNotes = [
        { freq: 82,  dur: 0.25 }, { freq: 82,  dur: 0.25 }, { freq: 98,  dur: 0.25 }, { freq: 82,  dur: 0.25 },
        { freq: 73,  dur: 0.25 }, { freq: 73,  dur: 0.25 }, { freq: 87,  dur: 0.25 }, { freq: 73,  dur: 0.25 },
      ];
    }

    const beatDur = 60 / bpm;
    const newNodes: AudioNode[] = [];

    const scheduleNotes = (notes: NoteSeq, type: OscillatorType, gainVal: number, octave: number) => {
      let t = startTime;
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = type;
        osc.frequency.value = note.freq * octave;
        const dur = note.dur * beatDur * 4;
        g.gain.setValueAtTime(gainVal, t);
        g.gain.setValueAtTime(gainVal * 0.7, t + dur * 0.7);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        osc.start(t);
        osc.stop(t + dur + 0.01);
        newNodes.push(osc);
        newNodes.push(g);
        t += dur;
      });
      return t - startTime;
    };

    const melodyDur = scheduleNotes(melodyNotes, 'square', 0.06, 1);
    scheduleNotes(bassNotes, 'square', 0.06, 1);

    newNodes.forEach(n => this.bgmNodes.push(n));

    const rescheduleIn = Math.max(50, (melodyDur - 0.5) * 1000);
    this.bgmTimeoutId = setTimeout(() => {
      if (this.bgmActive && this.ctx) {
        this.bgmNodes = [];
        this._scheduleBGM(this.ctx.currentTime);
      }
    }, rescheduleIn);
  }
}

export const soundManager = new SoundManager();
