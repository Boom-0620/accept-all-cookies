/* WebAudio 合成音效 / 原创芯片音乐；Windows 95 启动采样来源见 assets/audio-sources.txt。 */

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* —— 原原创 8-bit 循环曲（C 大调，轻快）—— */
/* 主旋律：8 小节 × 8 个八分音符，null = 休止 */
const LEAD = [
  [76, null, 76, null, 79, null, 76, null],
  [72, 74, 76, null, 74, null, 72, null],
  [69, null, 72, null, 76, null, 79, 76],
  [74, null, null, 72, null, 67, null, null],
  [76, null, 76, null, 79, null, 81, null],
  [79, null, 76, null, 74, null, 72, 74],
  [76, 74, 72, null, 69, null, 67, null],
  [72, null, 67, null, 72, null, null, null],
];
const BASS_ROOT = [48, 45, 41, 43, 48, 45, 41, 43]; // 每小节根音（C Am F G）
const DESKTOP_LEAD = [
 [72,null,76,null,79,null,76,null], [74,null,72,null,69,null,null,null],
 [69,null,72,null,76,null,79,null], [74,null,71,null,67,null,null,null],
 [72,null,79,null,84,null,79,null], [81,null,76,null,72,null,null,null],
 [77,null,76,null,74,null,69,null], [71,null,74,null,72,null,null,null],
];
const THAI_LEAD = [
 [72,76,79,81,79,null,76,74],[72,null,74,76,79,76,74,null],
 [81,79,76,74,72,74,76,null],[79,null,81,84,81,79,76,null],
 [84,81,79,76,79,null,81,79],[76,74,72,null,74,76,79,null],
 [81,79,76,74,76,79,74,null],[72,null,76,79,76,74,72,null],
];

// A separate, original title tune: bright plucked melody, offbeat chords and soft drums.
const TITLE_LEAD = [
 [76,79,84,null,83,79,76,79], [81,null,79,76,74,72,74,null],
 [76,81,84,83,81,null,79,76], [74,79,83,null,86,83,79,null],
 [76,79,84,88,86,84,83,79], [81,84,86,null,84,81,79,76],
 [74,76,77,81,79,77,76,74], [72,null,79,76,72,null,74,79],
];
const TITLE_CHORDS = [[48,52,55],[53,57,60],[45,48,52],[43,47,50],[48,52,55],[53,57,60],[50,53,57],[43,47,50]];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = localStorage.getItem('cq-muted') === '1';
    this.musicTimer = null;
    this.musicTheme = null;
    this.musicStep = 0;
    this.musicNext = 0;
    this.eighth = 0.227; // 132 BPM 的八分音符时长
    this.onMuteChange = [];
    this.bootSource = null;
    this.bootSoundUntil = 0;
    this.bootGeneration = 0;
    this.bootBufferPromise = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.bootBufferPromise = fetch('./assets/windows95-startup.wav')
        .then(response => { if (!response.ok) throw new Error('Startup audio unavailable'); return response.arrayBuffer(); })
        .then(bytes => this.ctx.decodeAudioData(bytes)).catch(() => null);
    }
    if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') this.ctx.resume().catch(() => {});
    return true;
  }

  setMuted(m) {
    this.muted = m;
    localStorage.setItem('cq-muted', m ? '1' : '0');
    if (this.master) this.master.gain.value = m ? 0 : 1;
    if (!m) this.ensure();
    this.onMuteChange.forEach((f) => f(m));
    document.dispatchEvent(new CustomEvent('cq-mute', { detail: m }));
  }

  tone({ freq, end = null, dur = 0.1, type = 'square', vol = 0.2, delay = 0 }) {
    if (!this.ensure() || this.ctx.state !== 'running') return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (end && end !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.1, vol = 0.15, delay = 0, freq = 1600, type = 'bandpass' }) {
    if (!this.ensure() || this.ctx.state !== 'running') return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
  }

  /* —— 界面音效 —— */
  menuMove() { this.tone({freq:midi(79),end:midi(84),dur:.065,vol:.065,type:'sine'}); }
  menuConfirm() { [76,79,84].forEach((n,i)=>this.tone({freq:midi(n),dur:.13,vol:.07,type:'triangle',delay:i*.055})); }
  click()      { this.tone({ freq: 940, dur: 0.045, vol: 0.14, type: 'square' }); }
  openWin()    { this.tone({ freq: 520, dur: 0.06, vol: 0.14 }); this.tone({ freq: 790, dur: 0.08, vol: 0.14, delay: 0.06 }); }
  appExit() {
    // A short descending system chime, synthesized for this desktop.
    [76,72,67,60].forEach((n,i)=>this.tone({freq:midi(n),dur:.24,vol:.085,type:'triangle',delay:i*.095}));
    this.tone({freq:midi(48),dur:.42,vol:.035,type:'sine',delay:.28});
  }
  ding()       { this.tone({ freq: 660, dur: 0.09, vol: 0.16, type: 'triangle' }); this.tone({ freq: 660, dur: 0.22, vol: 0.12, type: 'triangle', delay: 0.1 }); }
  powerHum() {
    this.tone({ freq: 48, end: 56, dur: 1.5, vol: 0.05, type: 'sawtooth' });
    this.noise({ dur: 0.28, vol: 0.05, freq: 300, type: 'lowpass' });
  }
  async bootChime() {
    this.stopBootChime();
    if (!this.ensure()) return;
    const generation = this.bootGeneration;
    const buffer = await this.bootBufferPromise;
    if (generation !== this.bootGeneration || this.ctx.state !== 'running') return;
    if (!buffer) {
      [392,494,587,784].forEach((freq,i) => this.tone({freq,dur:.34,vol:.09,type:'triangle',delay:i*.13}));
      return;
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = .65;
    source.buffer = buffer;
    source.connect(gain).connect(this.master);
    this.bootSource = source;
    this.bootSoundUntil = this.ctx.currentTime + buffer.duration;
    source.onended = () => {
      source.disconnect(); gain.disconnect();
      if (this.bootSource === source) this.bootSource = null;
    };
    source.start();
  }

  stopBootChime() {
    this.bootGeneration++;
    if (this.bootSource) { this.bootSource.stop(); this.bootSource = null; }
    this.bootSoundUntil = 0;
  }

  /* —— 游戏音效 —— */
  stomach() {
    [[125,73,0],[91,145,.17],[132,66,.38],[104,77,.61]].forEach(([freq,end,delay])=>
      this.tone({freq,end,delay,dur:.19,vol:.09,type:'sine'}));
    this.noise({dur:.48,vol:.018,delay:.12,freq:240,type:'lowpass'});
  }
  jump()   { this.tone({ freq: 240, end: 540, dur: 0.14, vol: 0.15, type: 'square' }); }
  doubleJump() { this.tone({ freq: 330, end: 720, dur: 0.16, vol: 0.14, type: 'square' }); }
  coin()   { this.tone({ freq: 1047, dur: 0.05, vol: 0.13 }); this.tone({ freq: 1568, dur: 0.1, vol: 0.13, delay: 0.05 }); }
  hurt()   { this.tone({ freq: 220, end: 66, dur: 0.28, vol: 0.2, type: 'sawtooth' }); }
  fanfare() {
    [[523, 0], [659, .12], [784, .24], [659, .36], [784, .48], [1047, .62]]
      .forEach(([f, d]) => this.tone({ freq: f, dur: 0.22, vol: 0.14, type: 'square', delay: d }));
  }
  stinger() {
    this.tone({ freq: 880, dur: 0.3, vol: 0.16, type: 'sawtooth' });
    this.tone({ freq: 932, dur: 0.3, vol: 0.14, type: 'sawtooth' });
    this.noise({ dur: 0.16, vol: 0.12, freq: 2400 });
  }
  thud() { this.tone({ freq: 96, end: 36, dur: 0.35, vol: 0.3, type: 'sine' }); }
  glitchTick() {
    const f = 80 + Math.random() * 1300;
    this.tone({ freq: f, end: f * (0.4 + Math.random()), dur: 0.03 + Math.random() * 0.05, vol: 0.11, type: 'square' });
    if (Math.random() < 0.4) this.noise({ dur: 0.04 + Math.random() * 0.05, vol: 0.1, freq: 900 + Math.random() * 3000 });
  }

  /* —— 音乐调度 —— */
  startMusic(theme = 'play') {
    if (this.musicTimer && this.musicTheme === theme) {this.ensure();return;}
    this.stopMusic();
    this.musicTheme = theme;
    this.eighth = theme === 'thai' ? 60/118/2 : theme === 'desktop' ? 60/100/2 : theme === 'gallery' ? 60/112/2 : theme === 'title' ? 60/148/2 : .227;
    if (!this.ensure()) return;
    this.musicStep = 0;
    this.musicNext = this.ctx.currentTime + 0.08;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 30);
  }

  scheduleMusic() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    if (this.musicTheme === 'desktop' && ctx.currentTime < this.bootSoundUntil) return;
    if (this.musicNext < ctx.currentTime-.1) this.musicNext=ctx.currentTime+.03;
    while (this.musicNext < ctx.currentTime + 0.18) {
      const s = this.musicStep;
      const bar = Math.floor(s / 8) % 8;
      const beat = s % 8;
      const t0 = this.musicNext;
      if(this.musicTheme==='thai'){
        const delay=t0-ctx.currentTime,n=THAI_LEAD[bar][beat];
        if(n){this.tone({freq:midi(n),dur:.19,vol:.055,type:'sine',delay});this.tone({freq:midi(n+12),dur:.065,vol:.013,type:'triangle',delay});}
        if(beat%2===0)this.tone({freq:midi([48,53,45,43][bar%4]+(beat===4?7:0)),dur:.23,vol:.035,type:'triangle',delay});
        if(beat===2||beat===6)this.noise({dur:.025,vol:.015,freq:1400,type:'bandpass',delay});
        this.musicNext+=this.eighth;this.musicStep++;continue;
      }
      if(this.musicTheme==='desktop'){
        const delay=t0-ctx.currentTime,n=DESKTOP_LEAD[bar][beat];
        if(n){this.tone({freq:midi(n),dur:.48,vol:.065,type:'triangle',delay});this.tone({freq:midi(n+12),dur:.25,vol:.012,type:'sine',delay});}
        if(beat===0||beat===4)this.tone({freq:midi(TITLE_CHORDS[bar][0]+12),dur:.6,vol:.04,type:'sine',delay});
        if(beat===2||beat===6)this.tone({freq:midi(TITLE_CHORDS[bar][2]+12),dur:.4,vol:.022,type:'triangle',delay});
        this.musicNext+=this.eighth;this.musicStep++;continue;
      }
      if(this.musicTheme==='gallery'){
        const delay=t0-ctx.currentTime,n=TITLE_LEAD[bar][beat];
        if(n)this.tone({freq:midi(n),dur:.28,vol:.035,type:'sine',delay});
        if(beat%2===0)this.tone({freq:midi(TITLE_CHORDS[bar][0]+12),dur:.32,vol:.025,type:'triangle',delay});
        if(beat===0||beat===4)this.tone({freq:midi(TITLE_CHORDS[bar][2]+12),dur:.38,vol:.018,type:'sine',delay});
        this.musicNext+=this.eighth;this.musicStep++;continue;
      }
      if (this.musicTheme === 'title') {
        this.scheduleTitleNote(bar,beat,t0-ctx.currentTime);
        this.musicNext+=this.eighth*(beat%2===0?1.06:.94);
        this.musicStep++;
        continue;
      }
      const note = LEAD[bar][beat];
      if (note) {
        this.tone({ freq: midi(note), dur: this.eighth * 0.92, vol: 0.055, type: 'square', delay: t0 - ctx.currentTime });
      }
      if (beat === 0 || beat === 4) {
        const root = BASS_ROOT[bar];
        this.tone({ freq: midi(beat === 0 ? root : root + 7), dur: this.eighth * 1.7, vol: 0.085, type: 'triangle', delay: t0 - ctx.currentTime });
      }
      if (beat % 2 === 0) {
        this.noise({ dur: 0.025, vol: beat % 4 === 0 ? 0.022 : 0.012, freq: 6000, type: 'highpass', delay: t0 - ctx.currentTime });
      }
      this.musicNext += this.eighth;
      this.musicStep++;
    }
  }

  scheduleTitleNote(bar,beat,delay) {
    const note=TITLE_LEAD[bar][beat],chord=TITLE_CHORDS[bar];
    if(note){
      this.tone({freq:midi(note),dur:.21,vol:.063,type:'triangle',delay});
      this.tone({freq:midi(note+12),dur:.105,vol:.014,type:'sine',delay});
    }
    // Alternating root and fifth gives a light, skipping bass line.
    if(beat%2===0)this.tone({freq:midi(chord[0]+(beat===2||beat===6?7:0)),dur:.22,vol:.073,type:'triangle',delay});
    if(beat%2===1)for(const n of chord)this.tone({freq:midi(n+12),dur:.075,vol:.014,type:'triangle',delay});
    if(beat===0||beat===4)this.tone({freq:130,end:48,dur:.095,vol:.075,type:'sine',delay});
    if(beat===2||beat===6)this.noise({dur:.055,vol:.024,freq:1800,type:'highpass',delay});
    this.noise({dur:.019,vol:beat%2?.009:.014,freq:7500,type:'highpass',delay});
    if(bar%4===3&&beat===7)this.tone({freq:midi(91),dur:.09,vol:.018,type:'sine',delay});
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
    this.musicTheme = null;
  }

  /* 反转用：音乐像卡带一样短促重复 */
  stutterMusic() {
    this.stopMusic();
    const notes = [79, 74, 72];
    notes.forEach((n, i) => {
      for (let k = 0; k < 2; k++) {
        this.tone({ freq: midi(n), end: midi(n) * 0.94, dur: 0.05, vol: 0.1, type: 'square', delay: i * 0.11 + k * 0.05 });
      }
    });
  }
}
