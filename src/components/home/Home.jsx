import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import isMobile from "../../utils/isMobile";
import "./Home.css";

function NeonButton({ children, onClick, to, color = '#00e5ff', size = 'md', delay = 0 }) {
  const [hov, setHov] = useState(false);
  const lg = size === 'lg';
  const style = {
    display: 'block',
    width: '100%',
    padding: lg ? '18px 40px' : '13px 28px',
    background: hov ? `${color}18` : 'rgba(4,0,18,0.65)',
    border: `2px solid ${color}`,
    borderRadius: 3,
    color: hov ? '#fff' : color,
    fontFamily: "'Orbitron', sans-serif",
    fontSize: lg ? 17 : 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    transition: 'all 0.16s',
    boxShadow: hov
      ? `0 0 24px ${color}99, 0 0 48px ${color}44, inset 0 0 16px ${color}22`
      : `0 0 8px ${color}33`,
    animation: `fadeDown 0.4s ${delay}s both`,
    backdropFilter: 'blur(12px)',
    textTransform: 'uppercase',
    textDecoration: 'none',
    boxSizing: 'border-box',
  };

  if (to) {
    return (
      <Link to={to} style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={style}>
      {children}
    </button>
  );
}

function Home({ socket }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [screen, setScreen] = useState('home');
  const canvasRef = useRef(null);
  const currentLang = (i18n.language || 'en').substring(0, 2);

  useEffect(() => {
    socket.emit("leave-room");
  }, [location]);

  useEffect(() => {
    if (isMobile) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const COLS = 34, ROWS = 46, W_WIDE = 22, H_MAX = 5.2;
    const Z_NEAR = 0.18, Z_FAR = 22;
    const ROW_STEP = (Z_FAR - Z_NEAR) / (ROWS - 1);
    const CAM_Y = 1.2, FOV = 290, HRZ = 0.46, SPEED = 1.4;
    let W = 0, H = 0, scrollZ = 0, lastT = 0;
    let stars = [];
    let animId;

    function seeded(s) { return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

    function th(wx, wz) {
      const nx = wx / (W_WIDE / 2);
      const prof = Math.max(0, Math.pow(Math.abs(nx) - 0.20, 0.70) * 1.55);
      const v = Math.sin(wx * 0.40 + wz * 0.22) * 0.38
        + Math.sin(wx * 0.95 - wz * 0.16) * 0.28
        + Math.sin(wx * 0.22 + wz * 0.48) * 0.20
        + Math.cos(wx * 0.70 + wz * 0.10) * 0.15
        + Math.sin(wx * 1.80 + wz * 0.32) * 0.20
        + Math.sin(wx * 3.20 + wz * 0.18) * 0.14
        + Math.sin(wx * 0.14 - wz * 0.60) * 0.08;
      return prof * H_MAX * Math.max(0, (v + 1.43) / 2.86 * 0.80 + 0.20);
    }

    function proj(wx, wy, rz) {
      if (rz <= 0.001) return null;
      return {
        x: W / 2 + (wx / rz) * FOV,
        y: H * HRZ + (CAM_Y - wy) / rz * FOV,
      };
    }

    function buildGrid() {
      const nMax = Math.floor((scrollZ + Z_FAR) / ROW_STEP);
      const nMin = Math.ceil((scrollZ + Z_NEAR) / ROW_STEP);
      const rows = [];
      for (let n = nMax; n >= nMin; n--) {
        const wz = n * ROW_STEP;
        const relZ = wz - scrollZ;
        if (relZ <= 0) continue;
        const row = [];
        for (let c = 0; c < COLS; c++) {
          const wx = ((c / (COLS - 1)) - 0.5) * W_WIDE;
          const wy = th(wx, wz);
          const sp = proj(wx, wy, relZ);
          row.push(sp ? { x: sp.x, y: sp.y, wy } : null);
        }
        rows.push(row);
      }
      return rows;
    }

    const TTT = {
      phase: 'wait', phaseT: 0, x: 0, y: 0, cs: 0,
      alpha: 0, marks: [], seq: [], markT: 0,
      reset() {
        this.cs = Math.min(W, H) * 0.040;
        this.x = W * (0.12 + Math.random() * 0.76);
        this.y = H * (0.05 + Math.random() * 0.28);
        this.alpha = 0; this.phase = 'fadeIn'; this.phaseT = 0;
        this.marks = []; this.markT = 0;
        const games = [
          [{ c: 4, m: 'X' }, { c: 0, m: 'O' }, { c: 8, m: 'X' }, { c: 2, m: 'O' }, { c: 6, m: 'X' }],
          [{ c: 4, m: 'X' }, { c: 1, m: 'O' }, { c: 3, m: 'X' }, { c: 5, m: 'O' }, { c: 7, m: 'X' }, { c: 2, m: 'O' }],
          [{ c: 0, m: 'X' }, { c: 4, m: 'O' }, { c: 2, m: 'X' }, { c: 1, m: 'O' }, { c: 6, m: 'X' }],
          [{ c: 4, m: 'X' }, { c: 6, m: 'O' }, { c: 2, m: 'X' }, { c: 8, m: 'O' }, { c: 0, m: 'X' }],
        ];
        this.seq = games[Math.floor(Math.random() * games.length)];
      },
      update(dt) {
        this.phaseT += dt;
        const FADE = 0.55, MI = 0.78, HOLD = 1.5, WAIT = 2.0, MAX_A = 0.30;
        if (this.phase === 'wait') {
          if (this.phaseT > WAIT) this.reset();
        } else if (this.phase === 'fadeIn') {
          this.alpha = Math.min(MAX_A, (this.phaseT / FADE) * MAX_A);
          if (this.phaseT > FADE) { this.phase = 'play'; this.phaseT = 0; }
        } else if (this.phase === 'play') {
          this.markT += dt;
          const shown = Math.floor(this.markT / MI);
          const frac = (this.markT % MI) / MI;
          this.marks = this.seq.slice(0, Math.min(shown + 1, this.seq.length)).map((m, i) => ({
            ...m, progress: i < shown ? 1 : Math.min(1, frac / 0.55)
          }));
          if (shown >= this.seq.length) { this.phase = 'hold'; this.phaseT = 0; }
        } else if (this.phase === 'hold') {
          if (this.phaseT > HOLD) { this.phase = 'fadeOut'; this.phaseT = 0; }
        } else if (this.phase === 'fadeOut') {
          this.alpha = Math.max(0, MAX_A * (1 - this.phaseT / FADE));
          if (this.phaseT > FADE) { this.phase = 'wait'; this.phaseT = 0; }
        }
      },
      draw() {
        if (this.alpha <= 0 || this.phase === 'wait') return;
        const { x, y, cs: s, alpha } = this;
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ff44cc'; ctx.shadowColor = '#ff44cc'; ctx.shadowBlur = 7; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, y - s * 1.5); ctx.lineTo(x - s * 0.5, y + s * 1.5);
        ctx.moveTo(x + s * 0.5, y - s * 1.5); ctx.lineTo(x + s * 0.5, y + s * 1.5);
        ctx.moveTo(x - s * 1.5, y - s * 0.5); ctx.lineTo(x + s * 1.5, y - s * 0.5);
        ctx.moveTo(x - s * 1.5, y + s * 0.5); ctx.lineTo(x + s * 1.5, y + s * 0.5);
        ctx.stroke();
        this.marks.forEach(({ c, m, progress }) => {
          const col = (c % 3) - 1, row = Math.floor(c / 3) - 1;
          const cx = x + col * s, cy = y + row * s, mr = s * 0.36;
          if (m === 'X') {
            ctx.strokeStyle = '#00ddff'; ctx.shadowColor = '#00ddff'; ctx.shadowBlur = 10; ctx.lineWidth = 2.2;
            const d = mr * progress;
            ctx.beginPath(); ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d); ctx.stroke();
            if (progress > 0.5) {
              const d2 = mr * (progress - 0.5) * 2;
              ctx.beginPath(); ctx.moveTo(cx + d2, cy - d2); ctx.lineTo(cx - d2, cy + d2); ctx.stroke();
            }
          } else {
            ctx.strokeStyle = '#ff2288'; ctx.shadowColor = '#ff2288'; ctx.shadowBlur = 10; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.arc(cx, cy, mr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
          }
        });
        ctx.restore();
      }
    };

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, H * HRZ);
      sky.addColorStop(0, '#040010');
      sky.addColorStop(0.20, '#0e0030');
      sky.addColorStop(0.50, '#500062');
      sky.addColorStop(0.80, '#cc0062');
      sky.addColorStop(1, '#e8006e');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * HRZ);
      const gnd = ctx.createLinearGradient(0, H * HRZ, 0, H);
      gnd.addColorStop(0, '#240048');
      gnd.addColorStop(0.35, '#160030');
      gnd.addColorStop(1, '#080018');
      ctx.fillStyle = gnd; ctx.fillRect(0, H * HRZ, W, H * (1 - HRZ));
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const y = (i / 40) * H * HRZ;
        ctx.globalAlpha = 0.015 + (i / 40) * 0.055;
        ctx.fillStyle = i > 25 ? '#ff1188' : '#440066';
        ctx.fillRect(0, y, W, 2.5);
      }
      ctx.restore();
    }

    function drawStars() {
      const t0 = lastT * 0.001;
      stars.forEach(s => {
        const f = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t0 * s.sp + s.ph));
        ctx.save(); ctx.globalAlpha = f;
        ctx.fillStyle = s.b ? '#fff' : '#e0c8ff';
        if (s.b) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        if (s.b && s.r > 1.4) {
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          for (let a = 0; a < 4; a++) {
            ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a * Math.PI / 2);
            ctx.beginPath(); ctx.moveTo(-s.r * 0.22, s.r * 0.1); ctx.lineTo(0, s.r * 3.2); ctx.lineTo(s.r * 0.22, s.r * 0.1);
            ctx.closePath(); ctx.fill(); ctx.restore();
          }
        }
        ctx.restore();
      });
    }

    function drawSun(t) {
      const cx = W / 2;
      const cy = H * (HRZ - 0.15);
      const r = Math.min(W, H) * 0.15;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.5);
      const og = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 3.0);
      og.addColorStop(0, `rgba(255,${Math.round(70 + 40 * pulse)},0,0.50)`);
      og.addColorStop(0.35, 'rgba(200,0,80,0.22)');
      og.addColorStop(1, 'transparent');
      ctx.fillStyle = og;
      ctx.fillRect(cx - r * 3.2, cy - r * 3.2, r * 6.4, r * 6.4);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      const sg = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      sg.addColorStop(0, '#ffee00');
      sg.addColorStop(0.22, '#ff8800');
      sg.addColorStop(0.55, '#ff2222');
      sg.addColorStop(1, '#aa0044');
      ctx.fillStyle = sg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      for (let i = 0; i < 10; i++) {
        const sy = cy + (i / 10) * r * 0.88;
        ctx.fillStyle = `rgba(4,0,10,${0.40 + i * 0.042})`;
        ctx.fillRect(cx - r, sy, r * 2, 5.5 + i * 0.5);
      }
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,200,0,0.18)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }

    function drawTerrain(rows) {
      if (rows.length < 2) return;
      const NR = rows.length;
      for (let ri = 0; ri < NR - 1; ri++) {
        const rA = rows[ri], rB = rows[ri + 1];
        for (let c = 0; c < COLS - 1; c++) {
          const p00 = rA[c], p01 = rA[c + 1], p10 = rB[c], p11 = rB[c + 1];
          if (!p00 || !p01 || !p10 || !p11) continue;
          const avgWy = (p00.wy + p01.wy + p10.wy + p11.wy) / 4;
          ctx.fillStyle = avgWy < 0.5 ? '#1a0038' : '#060016';
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y); ctx.lineTo(p01.x, p01.y);
          ctx.lineTo(p11.x, p11.y); ctx.lineTo(p10.x, p10.y);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.shadowBlur = 4;
      for (let ri = 0; ri < NR; ri++) {
        const d = ri / (NR - 1);
        ctx.globalAlpha = 0.14 + d * 0.86;
        ctx.lineWidth = 0.45 + d * 1.0;
        ctx.strokeStyle = '#0055ff'; ctx.shadowColor = '#00aaff';
        ctx.beginPath();
        const row = rows[ri];
        for (let c = 0; c < COLS - 1; c++) {
          const p0 = row[c], p1 = row[c + 1];
          if (!p0 || !p1) continue;
          ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        }
        ctx.stroke();
      }
      const B = 10;
      for (let b = 0; b < B; b++) {
        const rMin = Math.floor(b * (NR - 1) / B);
        const rMax = Math.floor((b + 1) * (NR - 1) / B);
        const d = (b + 0.5) / B;
        ctx.globalAlpha = 0.10 + d * 0.75;
        ctx.lineWidth = 0.38 + d * 0.82;
        ctx.strokeStyle = '#0044cc'; ctx.shadowColor = '#0088ee'; ctx.shadowBlur = 3;
        ctx.beginPath();
        for (let c = 0; c < COLS; c++) {
          for (let ri = rMin; ri < Math.min(rMax, NR - 1); ri++) {
            const p0 = rows[ri][c], p1 = rows[ri + 1][c];
            if (!p0 || !p1) continue;
            ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
          }
        }
        ctx.stroke();
      }
      ctx.strokeStyle = '#55ddff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10; ctx.lineWidth = 1.5;
      for (let ri = 0; ri < NR; ri++) {
        const d = ri / (NR - 1);
        ctx.globalAlpha = 0.06 + d * 0.55;
        ctx.beginPath();
        const row = rows[ri];
        for (let c = 0; c < COLS - 1; c++) {
          const p0 = row[c], p1 = row[c + 1];
          if (!p0 || !p1 || p0.wy < H_MAX * 0.48 || p1.wy < H_MAX * 0.48) continue;
          ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    function drawAtmos() {
      const hg = ctx.createLinearGradient(0, H * (HRZ - 0.05), 0, H * (HRZ + 0.06));
      hg.addColorStop(0, 'transparent');
      hg.addColorStop(0.5, 'rgba(150,0,180,0.18)');
      hg.addColorStop(1, 'transparent');
      ctx.fillStyle = hg; ctx.fillRect(0, H * (HRZ - 0.05), W, H * 0.11);
      const fg = ctx.createLinearGradient(0, H * 0.90, 0, H);
      fg.addColorStop(0, 'transparent');
      fg.addColorStop(0.5, 'rgba(5,0,16,0.55)');
      fg.addColorStop(1, 'rgba(4,0,12,0.88)');
      ctx.fillStyle = fg; ctx.fillRect(0, H * 0.90, W, H * 0.10);
      ['left', 'right'].forEach((_, i) => {
        const g = ctx.createLinearGradient(i === 0 ? 0 : W, 0, i === 0 ? W * 0.12 : W * 0.88, 0);
        g.addColorStop(0, 'rgba(3,0,10,0.55)'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(i === 0 ? 0 : W * 0.88, 0, W * 0.12, H);
      });
    }

    function drawScan() {
      ctx.save(); ctx.globalAlpha = 0.044;
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = '#000'; ctx.fillRect(0, y, W, 2); }
      ctx.restore();
    }

    function tick(ts) {
      const dt = Math.min(0.05, (ts - lastT) / 1000);
      lastT = ts; scrollZ += SPEED * dt;
      TTT.update(dt);
      ctx.clearRect(0, 0, W, H);
      drawBackground();
      drawStars();
      TTT.draw();
      drawSun(ts * 0.001);
      drawTerrain(buildGrid());
      drawAtmos();
      drawScan();
      animId = requestAnimationFrame(tick);
    }

    function handleResize() {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    }

    function init() {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      const r = seeded(42);
      for (let i = 0; i < 160; i++) stars.push({
        x: r() * W, y: r() * H * 0.56, r: 0.5 + r() * 2,
        ph: r() * Math.PI * 2, sp: 0.6 + r() * 2.2, b: r() > 0.80,
      });
      TTT.reset();
      window.addEventListener('resize', handleResize);
      animId = requestAnimationFrame(tick);
    }
    init();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const backBtnStyle = {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.32)',
    fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: '0.15em',
    cursor: 'pointer', marginTop: 4, transition: 'color 0.15s', textTransform: 'uppercase',
  };

  const subLabelStyle = (color) => ({
    fontSize: 10, letterSpacing: '0.28em', color, opacity: 0.75,
    textAlign: 'center', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase',
    fontFamily: "'Orbitron', sans-serif",
  });

  return (
    <div className="home-container">
      {isMobile ? (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: 'linear-gradient(180deg, #040010 0%, #0e0030 15%, #500062 45%, #cc0062 65%, #240048 80%, #080018 100%)',
        }} />
      ) : (
        <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, display: 'block' }} />
      )}

      {/* Scanlines overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 80,
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.055) 50%, transparent 50%)',
        backgroundSize: '100% 4px',
      }} />

      {/* Language toggle */}
      <div style={{
        position: 'fixed', top: 24, right: 28, zIndex: 50, display: 'flex',
        border: '1.5px solid #6600cc88', borderRadius: 3, overflow: 'hidden',
      }}>
        {['pt', 'en'].map(l => (
          <button key={l} onClick={() => i18n.changeLanguage(l)} style={{
            padding: '7px 16px',
            background: currentLang === l ? '#6600ccaa' : 'rgba(4,0,18,0.75)',
            border: 'none',
            color: currentLang === l ? '#fff' : '#8844ccbb',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            cursor: 'pointer', transition: 'all 0.18s',
            boxShadow: currentLang === l ? '0 0 14px #6600cc55' : 'none',
          }}>{l.toUpperCase()}</button>
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 10, height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 20px',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            fontFamily: "'VT323', monospace", fontSize: 28, color: '#ff2d78',
            letterSpacing: '0.7em', textShadow: '0 0 16px #ff2d78, 0 0 32px #ff2d7855',
            marginBottom: 10, opacity: 0.82,
          }}>✕ ○ ✕</div>
          <h1 style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 'clamp(26px, 5.5vw, 62px)',
            fontWeight: 900, letterSpacing: '0.12em', color: '#fff',
            animation: 'logoIn 1s cubic-bezier(.22,1,.36,1) both, glowPulse 3.2s 1s ease-in-out infinite',
            lineHeight: 1.1, textTransform: 'uppercase', margin: 0,
          }}>{t('tictactoe')}</h1>
          <div style={{
            height: 3, width: '74%', margin: '14px auto 0',
            background: 'linear-gradient(90deg, transparent, #ff2d78, #cc00ff, #00e5ff, transparent)',
            boxShadow: '0 0 14px #ff2d78, 0 0 28px #cc00ff55', borderRadius: 2,
          }} />
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 380,
          background: 'rgba(4,0,18,0.72)',
          border: '1.5px solid rgba(0,229,255,0.30)',
          borderRadius: 6, padding: '34px 36px 30px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 40px rgba(180,0,255,0.18), 0 0 80px rgba(100,0,255,0.08), inset 0 0 40px rgba(100,0,255,0.04)',
          animation: 'neonBorder 3.5s ease-in-out infinite',
        }}>
          {screen === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp 0.5s both' }}>
              <NeonButton color="#ff2d78" size="lg" onClick={() => setScreen('multi')} delay={0.10}>
                {t('multiplayer')}
              </NeonButton>
              <NeonButton color="#00e5ff" size="lg" onClick={() => setScreen('single')} delay={0.20}>
                {t('singleplayer')}
              </NeonButton>
            </div>
          )}

          {screen === 'multi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, animation: 'fadeUp 0.4s both' }}>
              <div style={subLabelStyle('#ff2d78')}>{t('choose-mode')}</div>
              <NeonButton color="#ff2d78" to="/multiplayer/local" delay={0}>{t('local')}</NeonButton>
              <NeonButton color="#ff2d78" to="/multiplayer/friendly" delay={0.07}>{t('friend')}</NeonButton>
              <NeonButton color="#ff2d78" to="/multiplayer/random" delay={0.14}>{t('random-opponent')}</NeonButton>
              <button
                onClick={() => setScreen('home')}
                style={backBtnStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(188, 222, 241, 0.85)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 1)32)'}
              >{t('back')}</button>
            </div>
          )}

          {screen === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, animation: 'fadeUp 0.4s both' }}>
              <div style={subLabelStyle('#00e5ff')}>{t('choose-diff')}</div>
              <NeonButton color="#00e5ff" to="/singleplayer/easy" delay={0}>{t('easy')}</NeonButton>
              <NeonButton color="#00e5ff" to="/singleplayer/random-ia" delay={0.07}>{t('random')}</NeonButton>
              <NeonButton color="#00e5ff" to="/singleplayer/hard" delay={0.14}>{t('hard')}</NeonButton>
              <button
                onClick={() => setScreen('home')}
                style={backBtnStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(188, 222, 241, 0.85)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 1)32)'}
              >{t('back')}</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 28,
          fontFamily: "'VT323', monospace",
          fontSize: 17,
          color: 'rgba(100,0,255,0.65)',
          letterSpacing: '0.3em',
          textShadow: '0 0 10px #6600ff',
          animation: 'floatBob 3s ease-in-out infinite',
        }}>
          INSERT COIN TO CONTINUE
        </div>
      </div>
    </div>
  );
}

export default Home;
